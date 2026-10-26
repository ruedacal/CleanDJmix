import os
import sys
import json
import base64
import asyncio
import tempfile
import subprocess
import concurrent.futures
import threading
import hashlib
import uuid
import time
import urllib.request
import urllib.parse
from typing import Dict, Any, Optional, List
from io import BytesIO

try:
    import static_ffmpeg
    static_ffmpeg.add_paths()
except Exception:
    pass

try:
    from pydub import AudioSegment
    from aiohttp import ClientSession
    from shazamio import Shazam
    from shazamio.misc import ShazamUrl, Request
    from shazamio.converter import Converter
    from shazamio.algorithm import SignatureGenerator

    # CORRECCIÓN CRÍTICA DE BUGS EN SHAZAMIO:
    # Las constantes de ShazamUrl en versiones antiguas tienen espacios finales (ej. 'sampling=true ')
    # que provocan que aiohttp genere 'sampling=true+' y la API de Shazam devuelva error 400 Bad Request.
    for attr in dir(ShazamUrl):
        if not attr.startswith('__'):
            val = getattr(ShazamUrl, attr)
            if isinstance(val, str) and ' ' in val:
                setattr(ShazamUrl, attr, val.replace(' ', ''))
except Exception as e:
    print(f"[SHAZAM WARN] Error cargando ShazamIO o aplicando parche: {e}")
    Shazam = None


USER_AGENTS_POOL = [
    'Shazam/3379 CFNetwork/1494.0.7 Darwin/23.4.0',
    'Shazam/3382 CFNetwork/1498.7 Darwin/23.5.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
]


class ShazamRecognitionService:
    """
    Servicio de reconocimiento acústico inteligente multi-motor alimentado por:
    1. ShazamIO Precision Engine (con rotación anti-429, firmas a 16kHz y escaneo multi-segmento de drops y vocales)
    2. Apple Music / iTunes Acoustic Intelligence Fallback (búsqueda de metadatos de alta resolución)
    3. AudD Music Recognition API (respaldo alternativo para tokens de usuario)
    """

    def __init__(self):
        # Pool de hilos persistente para evitar creación/destrucción repetida de pools en consultas consecutivas
        self._executor = concurrent.futures.ThreadPoolExecutor(max_workers=2, thread_name_prefix="ShazamWorker")
        # Caché en memoria para respuestas acústicas de huellas ya procesadas (clave: md5_hash)
        self._cache = {}
        self._lock = threading.Lock()

    def __del__(self):
        try:
            if hasattr(self, '_executor') and self._executor:
                self._executor.shutdown(wait=False)
        except Exception:
            pass

    def _obtener_audio_hash(self, target: Any) -> Optional[str]:
        """Calcula un hash MD5 de los primeros bytes de audio para consulta instantánea en caché."""
        try:
            if isinstance(target, (bytes, bytearray)):
                sample = target[:32768]
                return hashlib.md5(sample).hexdigest()
            elif isinstance(target, str) and os.path.exists(target):
                with open(target, 'rb') as f:
                    sample = f.read(32768)
                return hashlib.md5(sample).hexdigest()
        except Exception:
            pass
        return None

    def _consultar_cache(self, audio_hash: Optional[str]) -> Optional[Dict[str, Any]]:
        """Recupera el resultado acústico previamente analizado si sigue vigente en caché."""
        if not audio_hash:
            return None
        with self._lock:
            if audio_hash in self._cache:
                ts, res = self._cache[audio_hash]
                # Válido durante 1 hora (3600 segundos)
                if time.time() - ts < 3600:
                    cached_copy = dict(res)
                    cached_copy["de_cache"] = True
                    return cached_copy
                else:
                    del self._cache[audio_hash]
        return None

    def _guardar_cache(self, audio_hash: Optional[str], result: Dict[str, Any]):
        """Almacena el resultado exitoso en caché acotando la memoria a un máximo de 100 entradas."""
        if not audio_hash or not result or result.get("status") != "ok":
            return
        with self._lock:
            if len(self._cache) > 100:
                ordenados = sorted(self._cache.items(), key=lambda x: x[1][0])
                for k, _ in ordenados[:20]:
                    self._cache.pop(k, None)
            self._cache[audio_hash] = (time.time(), result)

    def _ejecutar_async(self, coro_func, *args, **kwargs):
        """Ejecuta una corrutina de manera segura reutilizando el pool de workers persistente."""
        def runner():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                return loop.run_until_complete(coro_func(*args, **kwargs))
            finally:
                try:
                    loop.close()
                except Exception:
                    pass
        future = self._executor.submit(runner)
        return future.result(timeout=25.0)

    def _obtener_duracion_archivo(self, filepath: str) -> float:
        """Obtiene la duración en segundos de un archivo de audio con mutagen o ffprobe."""
        try:
            import mutagen
            f = mutagen.File(filepath)
            if f and f.info and getattr(f.info, 'length', None):
                return float(f.info.length)
        except Exception:
            pass

        try:
            cmd = ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filepath]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            val = res.stdout.strip()
            if val:
                return float(val)
        except Exception:
            pass
        return 0.0

    def _extraer_fragmento_wav(self, input_path: str, start_sec: float, duration_sec: float = 12.0) -> Optional[str]:
        """Extrae un fragmento de audio limpio en formato WAV de 44.1kHz estéreo usando ffmpeg."""
        try:
            tmp = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
            out_path = tmp.name
            tmp.close()
            cmd = [
                'ffmpeg', '-y',
                '-ss', str(max(0.0, float(start_sec))),
                '-i', input_path,
                '-t', str(float(duration_sec)),
                '-ar', '44100',
                '-ac', '2',
                out_path
            ]
            res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if res.returncode == 0 and os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
                return out_path
            if os.path.exists(out_path):
                os.remove(out_path)
        except Exception as e:
            print(f"[RECOGNITION] Error al extraer fragmento WAV: {e}")
        return None

    def _convertir_bytes_a_wav(self, raw_bytes: bytes, filename: str = "") -> Optional[str]:
        """Convierte cualquier flujo de bytes de audio (WebM, OGG, MP3, AAC, MP4, etc.) a archivo WAV temporal limpio."""
        in_path = None
        out_path = None
        try:
            # Detectar formato por magic bytes o sugerencia de nombre de archivo
            suffix = '.bin'
            fn_lower = (filename or "").lower()
            if raw_bytes.startswith(b'ID3') or raw_bytes.startswith(b'\xff\xfb') or raw_bytes.startswith(b'\xff\xf3') or fn_lower.endswith('.mp3'):
                suffix = '.mp3'
            elif raw_bytes.startswith(b'fLaC') or fn_lower.endswith('.flac'):
                suffix = '.flac'
            elif raw_bytes.startswith(b'RIFF') or fn_lower.endswith('.wav'):
                suffix = '.wav'
            elif b'webm' in raw_bytes[:64] or raw_bytes.startswith(b'\x1a\x45\xdf\xa3') or fn_lower.endswith('.webm'):
                suffix = '.webm'
            elif raw_bytes.startswith(b'OggS') or fn_lower.endswith('.ogg') or fn_lower.endswith('.opus'):
                suffix = '.ogg'
            elif (len(raw_bytes) >= 8 and raw_bytes[4:8] == b'ftyp') or raw_bytes.startswith(b'\xff\xf1') or fn_lower.endswith('.m4a') or fn_lower.endswith('.mp4'):
                suffix = '.m4a'
            elif '.' in fn_lower:
                ext = os.path.splitext(fn_lower)[1]
                if ext in ['.aac', '.wma', '.aiff']:
                    suffix = ext

            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f_in:
                f_in.write(raw_bytes)
                in_path = f_in.name
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f_out:
                out_path = f_out.name

            # Acotar a un máximo de 45s con '-t 45' para que la conversión sea casi instantánea
            cmd = ['ffmpeg', '-y', '-t', '45', '-i', in_path, '-ar', '44100', '-ac', '2', out_path]
            res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if res.returncode == 0 and os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
                return out_path
            if out_path and os.path.exists(out_path):
                os.remove(out_path)
        except Exception as e:
            print(f"[RECOGNITION] Error convirtiendo bytes a WAV: {e}")
        finally:
            if in_path and os.path.exists(in_path):
                try:
                    os.remove(in_path)
                except Exception:
                    pass
        return None

    async def _shazam_recognize_async(self, target: Any) -> Dict[str, Any]:
        """
        Reconocimiento acústico Shazam con motor anti-bloqueo:
        - Normalización a 16kHz mono 16-bit
        - Generador de huellas Shazam Landmark
        - Rotación de User-Agents modernos y respuesta inmediata ante 429 para no bloquear
        """
        try:
            if isinstance(target, (str, bytes, bytearray)):
                if isinstance(target, str) and os.path.exists(target):
                    audio = AudioSegment.from_file(target)
                else:
                    raw = target if isinstance(target, (bytes, bytearray)) else target.encode('utf-8')
                    audio = AudioSegment.from_file(BytesIO(raw))
            elif isinstance(target, AudioSegment):
                audio = target
            else:
                shz = Shazam()
                return await shz.recognize_song(target)

            # Normalizar ganancia agresivamente para capturas de micrófono ambiental con bajo volumen
            try:
                from pydub.effects import normalize
                audio = normalize(audio, headroom=0.1)
            except Exception:
                pass

            audio_proc = audio[:15000] if len(audio) > 16000 else audio
            audio_proc = audio_proc.set_sample_width(2).set_frame_rate(16000).set_channels(1)
            sig_gen = SignatureGenerator()
            sig_gen.feed_input(audio_proc.get_array_of_samples())
            sig_gen.MAX_TIME_SECONDS = 8
            sig = sig_gen.get_next_signature()
            sig_retries = 0
            while not sig and sig_retries < 3:
                sig = sig_gen.get_next_signature()
                sig_retries += 1

            if not sig:
                return {"matches": []}

            data = Converter.data_search(
                'Europe/Madrid',
                sig.encode_to_uri(),
                int(sig.number_samples / sig.sample_rate_hz * 1000),
                int(time.time() * 1000)
            )

            clean_url = 'https://amp.shazam.com/discovery/v5/es/ES/iphone/-/tag/{}/{}?sync=true&webv3=true&sampling=true&connected=&shazamapiversion=v3&sharehub=true&hubv5minorversion=v5.1&hidelb=true&video=v3'.format(
                str(uuid.uuid4()).upper(), str(uuid.uuid4()).upper()
            )

            for attempt, ua in enumerate(USER_AGENTS_POOL[:2]):
                headers = {
                    'User-Agent': ua,
                    'X-Shazam-Platform': 'IPHONE',
                    'X-Shazam-AppVersion': '17.8.0',
                    'Accept': 'application/json',
                    'Accept-Language': 'es-ES,es;q=0.9',
                }
                try:
                    async with ClientSession() as session:
                        async with session.post(clean_url, headers=headers, json=data, timeout=4.5) as resp:
                            if resp.status == 200:
                                res_json = await resp.json()
                                if res_json.get("matches"):
                                    return res_json
                            elif resp.status == 429:
                                return {"matches": [], "rate_limited": True}
                except Exception:
                    await asyncio.sleep(0.15)

            # Si el pase inicial no dio match y disponemos de suficiente audio, intentar un segundo segmento (offset 2.5s)
            if len(audio) >= 6500:
                audio_slice2 = audio[2500:15500].set_sample_width(2).set_frame_rate(16000).set_channels(1)
                sig_gen2 = SignatureGenerator()
                sig_gen2.feed_input(audio_slice2.get_array_of_samples())
                sig_gen2.MAX_TIME_SECONDS = 8
                sig2 = sig_gen2.get_next_signature()
                if sig2:
                    data2 = Converter.data_search(
                        'Europe/Madrid',
                        sig2.encode_to_uri(),
                        int(sig2.number_samples / sig2.sample_rate_hz * 1000),
                        int(time.time() * 1000)
                    )
                    clean_url2 = 'https://amp.shazam.com/discovery/v5/es/ES/iphone/-/tag/{}/{}?sync=true&webv3=true&sampling=true&connected=&shazamapiversion=v3&sharehub=true&hubv5minorversion=v5.1&hidelb=true&video=v3'.format(
                        str(uuid.uuid4()).upper(), str(uuid.uuid4()).upper()
                    )
                    try:
                        async with ClientSession() as session:
                            async with session.post(clean_url2, headers={'User-Agent': USER_AGENTS_POOL[0], 'X-Shazam-Platform': 'IPHONE', 'Accept': 'application/json'}, json=data2, timeout=4.5) as resp2:
                                if resp2.status == 200:
                                    res2_json = await resp2.json()
                                    if res2_json.get("matches"):
                                        return res2_json
                    except Exception:
                        pass
            return {"matches": []}
        except Exception as e:
            # Fallback al shazamio tradicional si la generación manual diera excepción
            try:
                shz = Shazam()
                return await shz.recognize_song(target)
            except Exception:
                return {"matches": []}

    def normalizar_resultado_shazam(self, raw_result: Dict[str, Any]) -> Dict[str, Any]:
        """Normaliza la respuesta nativa de Shazam a un formato estandarizado para BeatWave PRO."""
        if not raw_result or not isinstance(raw_result, dict):
            return {"status": "no_match", "msg": "No se obtuvieron datos acústicos."}

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
            "raw": track,
            "motor_usado": "Radar Acústico Shazam"
        }

    def normalizar_resultado(self, raw_result: Dict[str, Any]) -> Dict[str, Any]:
        """Alias para compatibilidad con suites de pruebas y servicios legado."""
        return self.normalizar_resultado_shazam(raw_result)

    def normalizar_resultado_audd(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Normaliza la respuesta de la API de AudD al formato de BeatWave PRO."""
        if not raw or not isinstance(raw, dict):
            return {"status": "no_match", "msg": "Sin respuesta de AudD."}

        status = raw.get("status")
        if status == "error":
            err_obj = raw.get("error", {})
            err_msg = err_obj.get("error_message") if isinstance(err_obj, dict) else str(err_obj)
            return {"status": "error", "msg": f"AudD API: {err_msg}"}

        result = raw.get("result")
        if not result:
            return {"status": "no_match", "msg": "AudD no encontró coincidencias acústicas para esta pista."}

        title = result.get("title", "Desconocido")
        artist = result.get("artist", "Desconocido")
        album = result.get("album") or f"{title} - Single"
        label = result.get("label", "")
        release_date = result.get("release_date", "")
        year = release_date[:4] if release_date else ""
        song_link = result.get("song_link", "")

        apple_music = result.get("apple_music") or {}
        spotify = result.get("spotify") or {}

        isrc = ""
        if isinstance(apple_music, dict) and apple_music.get("isrc"):
            isrc = apple_music.get("isrc")
        elif isinstance(spotify, dict):
            isrc = spotify.get("external_ids", {}).get("isrc", "")

        cover_url = ""
        if isinstance(spotify, dict):
            sp_album = spotify.get("album", {})
            images = sp_album.get("images", [])
            if images and len(images) > 0:
                cover_url = images[0].get("url", "")
        if not cover_url and isinstance(apple_music, dict):
            artwork = apple_music.get("artwork", {})
            if artwork.get("url"):
                cover_url = artwork.get("url", "").replace("{w}x{h}", "400x400")

        preview_url = ""
        if isinstance(apple_music, dict):
            previews = apple_music.get("previews", [])
            if previews and len(previews) > 0 and previews[0].get("url"):
                preview_url = previews[0].get("url")
        if not preview_url and isinstance(spotify, dict):
            preview_url = spotify.get("preview_url") or ""

        apple_music_url = apple_music.get("url", "") if isinstance(apple_music, dict) else ""
        genre_list = apple_music.get("genreNames", []) if isinstance(apple_music, dict) else []
        genre_name = genre_list[0] if genre_list else "Electronic"

        return {
            "status": "ok",
            "title": title,
            "artist": artist,
            "album": album,
            "label": label,
            "genre": genre_name,
            "year": year,
            "isrc": isrc,
            "cover": cover_url,
            "preview_url": preview_url,
            "shazam_url": song_link,
            "apple_music_url": apple_music_url,
            "lyrics": [],
            "spotify_query": f"{title} {artist}",
            "raw": result,
            "motor_usado": "AudD Music API"
        }

    def buscar_metadatos_itunes_fallback(self, file_path_or_tags: Any, original_filename: str = "") -> Optional[Dict[str, Any]]:
        """
        Búsqueda de respaldo en catálogo oficial Apple Music / iTunes por metadatos ID3 o nombre de archivo.
        Se activa automáticamente si la huella acústica no tiene match (ej. underground, bootlegs o grabaciones de baja ganancia).
        """
        title = None
        artist = None

        try:
            if isinstance(file_path_or_tags, str) and os.path.exists(file_path_or_tags):
                import mutagen
                f = mutagen.File(file_path_or_tags)
                if f and f.tags:
                    for k in ['title', 'TIT2', '\xa9nam', 'TITLE']:
                        if k in f.tags:
                            title = str(f.tags[k][0]) if isinstance(f.tags[k], list) else str(f.tags[k])
                            break
                    for k in ['artist', 'TPE1', '\xa9ART', 'ARTIST']:
                        if k in f.tags:
                            artist = str(f.tags[k][0]) if isinstance(f.tags[k], list) else str(f.tags[k])
                            break
                if not title or not artist:
                    base = os.path.splitext(os.path.basename(file_path_or_tags))[0]
                    for s in ['[FREE DOWNLOAD]', '[FREE]', '(OFFICIAL AUDIO)', '(OFFICIAL VIDEO)', '320KBPS', '128KBPS', 'FLAC', 'MP3']:
                        base = base.replace(s, '').replace(s.lower(), '')
                    if ' - ' in base:
                        parts = base.split(' - ', 1)
                        artist = parts[0].strip()
                        title = parts[1].strip()
            elif isinstance(file_path_or_tags, dict):
                title = file_path_or_tags.get("title")
                artist = file_path_or_tags.get("artist")

            # Si no se extrajo de tags, intentar desde original_filename
            # PROTEGER: Excluir nombres genéricos de grabaciones de micro o blobs temporales
            fn_lower = (original_filename or '').lower()
            es_nombre_generico = any(gen in fn_lower for gen in [
                'mic_sample', 'recording', 'grabacion', 'grabación', 'audio_chunk',
                'blob', 'input_mic', 'sample_temp', 'mic.', 'mic_test', 'captura'
            ])
            if (not title or not artist) and original_filename and not es_nombre_generico:
                base = os.path.splitext(os.path.basename(original_filename))[0]
                for s in ['[FREE DOWNLOAD]', '[FREE]', '(OFFICIAL AUDIO)', '(OFFICIAL VIDEO)', '320KBPS', '128KBPS', 'FLAC', 'MP3']:
                    base = base.replace(s, '').replace(s.lower(), '')
                if ' - ' in base:
                    parts = base.split(' - ', 1)
                    artist = parts[0].strip()
                    title = parts[1].strip()
                elif len(base.strip()) > 3:
                    title = base.strip()

            if not title:
                return None

            clean_q = f"{artist or ''} {title}".strip()
            url = f"https://itunes.apple.com/search?term={urllib.parse.quote(clean_q)}&entity=song&limit=3"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                if data.get('resultCount', 0) > 0:
                    item = data['results'][0]
                    return {
                        "status": "ok",
                        "title": item.get('trackName', title),
                        "artist": item.get('artistName', artist or 'Desconocido'),
                        "album": item.get('collectionName') or f"{title} - Single",
                        "label": item.get('collectionName', ''),
                        "genre": item.get('primaryGenreName', 'Electronic'),
                        "year": str(item.get('releaseDate', ''))[:4],
                        "isrc": "",
                        "cover": str(item.get('artworkUrl100', '')).replace('100x100bb', '600x600bb'),
                        "preview_url": item.get('previewUrl', ''),
                        "shazam_url": item.get('trackViewUrl', ''),
                        "apple_music_url": item.get('trackViewUrl', ''),
                        "lyrics": [],
                        "spotify_query": f"{item.get('trackName')} {item.get('artistName')}",
                        "raw": item,
                        "motor_usado": "Apple Music Intelligence"
                    }

            # Respaldo final si es pista underground o local: devolver datos limpios
            if title and (artist or original_filename):
                return {
                    "status": "ok",
                    "title": title,
                    "artist": artist or "Desconocido",
                    "album": f"{title} - Single",
                    "label": "",
                    "genre": "Electronic",
                    "year": "",
                    "isrc": "",
                    "cover": "",
                    "preview_url": "",
                    "shazam_url": "",
                    "apple_music_url": "",
                    "lyrics": [],
                    "spotify_query": f"{title} {artist or ''}".strip(),
                    "motor_usado": "Metadatos de Archivo / Tag ID3"
                }
        except Exception as e:
            print(f"[ITUNES FALLBACK ERR] {e}")
        return None

    def reconocer_shazamio(self, target: Any, filepath_context: Optional[str] = None) -> Dict[str, Any]:
        """Ejecuta el reconocimiento acústico nativo mediante Shazam con escaneo inteligente multi-segmento."""
        if not Shazam:
            return {"status": "error", "msg": "Biblioteca ShazamIO no disponible"}

        try:
            # 1. Escaneo primario del inicio (Offset 0)
            raw = self._ejecutar_async(self._shazam_recognize_async, target)
            if raw and raw.get("rate_limited"):
                # Salir inmediatamente sin intentar drop/breakdown para no demorar la respuesta
                return {"status": "rate_limited", "msg": "Servidor Shazam con límite de tasa (429). Conmutando a motor alternativo."}

            norm = self.normalizar_resultado_shazam(raw)
            if norm.get("status") == "ok":
                norm["motor_usado"] = "Radar Acústico Shazam"
                return norm

            # 2. Smart Multi-Slice Scanning para pistas de DJ o archivos con intros largas
            context_file = filepath_context if (filepath_context and os.path.exists(filepath_context)) else (target if (isinstance(target, str) and os.path.exists(target)) else None)
            if context_file:
                dur = self._obtener_duracion_archivo(context_file)
                if dur >= 25.0:
                    # Segmento 1: Drop principal (~30%)
                    slice_drop = self._extraer_fragmento_wav(context_file, start_sec=dur * 0.28, duration_sec=12.0)
                    if slice_drop:
                        try:
                            raw_drop = self._ejecutar_async(self._shazam_recognize_async, slice_drop)
                            if raw_drop and raw_drop.get("rate_limited"):
                                return {"status": "rate_limited", "msg": "Servidor Shazam con límite de tasa (429)."}
                            norm_drop = self.normalizar_resultado_shazam(raw_drop)
                            if norm_drop.get("status") == "ok":
                                norm_drop["motor_usado"] = "Shazam (Drop Acústico)"
                                return norm_drop
                        finally:
                            if os.path.exists(slice_drop):
                                try: os.remove(slice_drop)
                                except Exception: pass

                    # Segmento 2: Breakdown melódico / Vocales (~52%)
                    slice_break = self._extraer_fragmento_wav(context_file, start_sec=dur * 0.52, duration_sec=12.0)
                    if slice_break:
                        try:
                            raw_break = self._ejecutar_async(self._shazam_recognize_async, slice_break)
                            if raw_break and raw_break.get("rate_limited"):
                                return {"status": "rate_limited", "msg": "Servidor Shazam con límite de tasa (429)."}
                            norm_break = self.normalizar_resultado_shazam(raw_break)
                            if norm_break.get("status") == "ok":
                                norm_break["motor_usado"] = "Shazam (Breakdown Melódico)"
                                return norm_break
                        finally:
                            if os.path.exists(slice_break):
                                try: os.remove(slice_break)
                                except Exception: pass

            return norm
        except Exception as e:
            print(f"[SHAZAM ERROR] Reconocimiento Shazam falló: {e}")
            return {"status": "error", "msg": f"Error Shazam: {e}"}

    def reconocer_audd(self, audio_data: Any, audd_token: str = "") -> Dict[str, Any]:
        """Reconoce audio mediante la API de AudD Music Recognition."""
        import requests
        token = audd_token.strip() if audd_token and audd_token.strip() else "test"
        url = "https://api.audd.io/"

        data = {
            "api_token": token,
            "return": "apple_music,spotify"
        }

        file_to_close = None
        slice_temp_to_remove = None
        try:
            if isinstance(audio_data, str) and os.path.exists(audio_data):
                dur = self._obtener_duracion_archivo(audio_data)
                if dur > 30.0 or os.path.getsize(audio_data) > 4 * 1024 * 1024:
                    start = dur * 0.25 if dur > 40 else 0
                    slice_temp_to_remove = self._extraer_fragmento_wav(audio_data, start_sec=start, duration_sec=20.0)
                    target_file = slice_temp_to_remove if slice_temp_to_remove else audio_data
                else:
                    target_file = audio_data

                file_to_close = open(target_file, 'rb')
                files = {'file': file_to_close}
            elif isinstance(audio_data, bytes):
                files = {'file': ('audio.wav', audio_data, 'audio/wav')}
            else:
                return {"status": "error", "msg": "Formato de audio no compatible para AudD"}

            resp = requests.post(url, data=data, files=files, timeout=18)
            if resp.status_code != 200:
                return {"status": "error", "msg": f"AudD HTTP {resp.status_code}: {resp.text[:100]}"}

            res_json = resp.json()
            return self.normalizar_resultado_audd(res_json)
        except Exception as e:
            print(f"[AUDD ERROR] {e}")
            return {"status": "error", "msg": f"Error AudD: {e}"}
        finally:
            if file_to_close:
                try: file_to_close.close()
                except Exception: pass
            if slice_temp_to_remove and os.path.exists(slice_temp_to_remove):
                try: os.remove(slice_temp_to_remove)
                except Exception: pass

    def reconocer_archivo(self, filepath: str, motor: str = "hybrid", audd_token: str = "") -> Dict[str, Any]:
        """Identifica una pista a partir de la ruta de un archivo local usando el motor seleccionado."""
        if not filepath or not os.path.exists(filepath):
            return {"status": "error", "msg": "Archivo no encontrado"}

        # Verificar respuesta en caché para consultas consecutivas instantáneas
        audio_hash = self._obtener_audio_hash(filepath)
        cached = self._consultar_cache(audio_hash)
        if cached:
            return cached

        motor = (motor or "hybrid").lower().strip()

        if motor == "audd":
            token_to_use = audd_token.strip() if (audd_token and audd_token.strip()) else "test"
            res = self.reconocer_audd(filepath, audd_token=token_to_use)
            if res.get("status") == "ok":
                self._guardar_cache(audio_hash, res)
            return res

        # 1. Reconocimiento acústico por huella Shazam con escaneo multi-segmento
        res_shazam = self.reconocer_shazamio(filepath, filepath_context=filepath)
        if res_shazam.get("status") == "ok":
            self._guardar_cache(audio_hash, res_shazam)
            return res_shazam

        # 2. Respaldo AudD (con token de usuario o token de respaldo 'test')
        token_to_use = audd_token.strip() if (audd_token and audd_token.strip()) else "test"
        res_audd = self.reconocer_audd(filepath, audd_token=token_to_use)
        if res_audd.get("status") == "ok":
            self._guardar_cache(audio_hash, res_audd)
            return res_audd

        # 3. Respaldo de Inteligencia Acústica por Metadatos y Catálogo Apple Music
        res_itunes = self.buscar_metadatos_itunes_fallback(filepath, original_filename=os.path.basename(filepath))
        if res_itunes and res_itunes.get("status") == "ok":
            self._guardar_cache(audio_hash, res_itunes)
            return res_itunes

        return {
            "status": "no_match",
            "msg": "No se encontraron coincidencias acústicas ni en Shazam ni en el catálogo de referencia."
        }

    def reconocer_bytes(self, audio_bytes: bytes, motor: str = "hybrid", audd_token: str = "", filename: str = "") -> Dict[str, Any]:
        """Identifica una pista a partir de bytes binarios de audio en memoria (subidas Web o grabaciones de micro)."""
        if not audio_bytes or len(audio_bytes) < 300:
            return {"status": "error", "msg": "Datos de audio insuficientes"}

        # Verificar respuesta en caché para consultas consecutivas instantáneas
        audio_hash = self._obtener_audio_hash(audio_bytes)
        cached = self._consultar_cache(audio_hash)
        if cached:
            return cached

        motor = (motor or "hybrid").lower().strip()

        # Convertir a WAV limpio para compatibilidad de codecs de navegador (WebM, Opus, MP3, etc.)
        wav_path = self._convertir_bytes_a_wav(audio_bytes, filename=filename)
        target = wav_path if wav_path else audio_bytes

        # Detección preventiva de silencio o volumen casi nulo en capturas de micrófono
        if wav_path and os.path.exists(wav_path):
            try:
                check_seg = AudioSegment.from_file(wav_path)
                if check_seg.dBFS < -44.0 or check_seg.rms < 120:
                    return {
                        "status": "silence",
                        "msg": "⚠️ Señal de micrófono inaudible o en silencio ({:.1f} dBFS). Acerca la fuente de sonido o verifica los permisos y nivel de entrada de audio en Ajustes de macOS > Privacidad > Micrófono.".format(check_seg.dBFS)
                    }
            except Exception:
                pass

        try:
            if motor == "audd":
                token_to_use = audd_token.strip() if (audd_token and audd_token.strip()) else "test"
                res = self.reconocer_audd(target, audd_token=token_to_use)
                if res.get("status") == "ok":
                    self._guardar_cache(audio_hash, res)
                return res

            # 1. Reconocimiento primario con Shazam y escaneo de drops si es archivo largo
            res_shazam = self.reconocer_shazamio(target, filepath_context=wav_path)
            if res_shazam.get("status") == "ok":
                self._guardar_cache(audio_hash, res_shazam)
                return res_shazam

            # 2. Respaldo AudD (con token de usuario o token de respaldo 'test')
            token_to_use = audd_token.strip() if (audd_token and audd_token.strip()) else "test"
            res_audd = self.reconocer_audd(target, audd_token=token_to_use)
            if res_audd.get("status") == "ok":
                self._guardar_cache(audio_hash, res_audd)
                return res_audd

            # 3. Respaldo de Inteligencia Acústica en metadatos y nombre original del archivo subido
            res_itunes = self.buscar_metadatos_itunes_fallback(wav_path if (wav_path and os.path.exists(wav_path)) else "", original_filename=filename)
            if res_itunes and res_itunes.get("status") == "ok":
                self._guardar_cache(audio_hash, res_itunes)
                return res_itunes

            return {
                "status": "no_match",
                "msg": "No se encontraron coincidencias acústicas para este fragmento de audio."
            }
        finally:
            if wav_path and os.path.exists(wav_path):
                try:
                    os.remove(wav_path)
                except Exception:
                    pass

    def reconocer_base64(self, b64_str: str, motor: str = "hybrid", audd_token: str = "", filename: str = "") -> Dict[str, Any]:
        """Identifica una pista recibiendo audio codificado en Base64."""
        if not b64_str or not isinstance(b64_str, str):
            return {"status": "error", "msg": "Audio Base64 no proporcionado"}

        try:
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            audio_bytes = base64.b64decode(b64_str)
            return self.reconocer_bytes(audio_bytes, motor=motor, audd_token=audd_token, filename=filename)
        except Exception as e:
            print(f"[RECOGNITION ERROR] Decodificación Base64 falló: {e}")
            return {"status": "error", "msg": f"Error procesando audio: {e}"}

    def grabar_microfono_sistema(self, duration_sec: int = 7, motor: str = "hybrid", audd_token: str = "") -> Dict[str, Any]:
        """
        Graba directamente desde el micrófono de hardware del sistema (macOS AVFoundation, Linux Pulse/ALSA, Windows DShow)
        mediante FFmpeg y ejecuta el reconocimiento acústico.
        Garantiza que el DJ pueda identificar canciones incluso si el navegador web bloquea el acceso al micro o en orígenes HTTP.
        """
        duration = max(3, min(15, int(duration_sec or 7)))
        temp_wav = os.path.join(tempfile.gettempdir(), f"shazam_hw_mic_{uuid.uuid4().hex[:8]}.wav")

        try:
            ffmpeg_cmd = None
            if sys.platform == 'darwin':
                # macOS: AVFoundation con micrófono del sistema por defecto
                ffmpeg_cmd = [
                    'ffmpeg', '-y', '-f', 'avfoundation',
                    '-i', ':default',
                    '-t', str(duration),
                    '-ar', '44100', '-ac', '2',
                    temp_wav
                ]
            elif sys.platform.startswith('linux'):
                ffmpeg_cmd = [
                    'ffmpeg', '-y', '-f', 'pulse',
                    '-i', 'default',
                    '-t', str(duration),
                    '-ar', '44100', '-ac', '2',
                    temp_wav
                ]
            elif sys.platform == 'win32':
                ffmpeg_cmd = [
                    'ffmpeg', '-y', '-f', 'dshow',
                    '-i', 'audio=Microphone',
                    '-t', str(duration),
                    '-ar', '44100', '-ac', '2',
                    temp_wav
                ]

            if not ffmpeg_cmd:
                return {"status": "error", "msg": f"Captura directa no soportada en la plataforma {sys.platform}"}

            proc = subprocess.run(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=duration + 5)

            # En macOS, si ':default' falla, intentar con ':1' o ':0'
            if proc.returncode != 0 and sys.platform == 'darwin':
                for alt_dev in [':1', ':0']:
                    alt_cmd = ['ffmpeg', '-y', '-f', 'avfoundation', '-i', alt_dev, '-t', str(duration), '-ar', '44100', '-ac', '2', temp_wav]
                    proc2 = subprocess.run(alt_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=duration + 5)
                    if proc2.returncode == 0:
                        proc = proc2
                        break

            if proc.returncode != 0 or not os.path.exists(temp_wav) or os.path.getsize(temp_wav) < 1000:
                err_text = proc.stderr[-300:] if proc.stderr else "Error en captura de audio de sistema"
                return {
                    "status": "error",
                    "msg": f"No se pudo capturar audio del micrófono de hardware ({err_text}). Verifica permisos de micrófono en Ajustes del Sistema."
                }

            # Ejecutar el pipeline de reconocimiento sobre el archivo grabado
            res = self.reconocer_archivo(temp_wav, motor=motor, audd_token=audd_token)
            if res and isinstance(res, dict):
                res['origen_captura'] = 'hardware_mic'
            return res
        except Exception as e:
            return {"status": "error", "msg": f"Error en captura de micrófono de hardware: {e}"}
        finally:
            if os.path.exists(temp_wav):
                try:
                    os.unlink(temp_wav)
                except Exception:
                    pass
