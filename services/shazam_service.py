import os
import sys
import ssl
import json
import math
import wave
import array
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
from typing import Dict, Any, Optional, List, Tuple

# Bootstrap TLS/SSL omnichannel: garantiza certificados raíz válidos en macOS, Windows y Linux
_CA_BUNDLE: Optional[str] = None
try:
    import certifi
    _ca_path = certifi.where()
    if _ca_path and os.path.exists(_ca_path):
        _CA_BUNDLE = _ca_path
        if not os.environ.get("SSL_CERT_FILE"):
            os.environ["SSL_CERT_FILE"] = _CA_BUNDLE
        if not os.environ.get("REQUESTS_CA_BUNDLE"):
            os.environ["REQUESTS_CA_BUNDLE"] = _CA_BUNDLE
        _SSL_CONTEXT = ssl.create_default_context(cafile=_CA_BUNDLE)
    else:
        _SSL_CONTEXT = ssl.create_default_context()
except Exception:
    _SSL_CONTEXT = ssl.create_default_context()

try:
    import numpy as np
except Exception:
    np = None

try:
    import static_ffmpeg
    static_ffmpeg.add_paths()
except Exception:
    pass

Shazam = None
_SHAZAM_IMPORT_ERROR: Optional[str] = None

try:
    from shazamio import Shazam  # type: ignore
except Exception as e:
    _SHAZAM_IMPORT_ERROR = str(e)
    print(f"[SHAZAM WARN] Error cargando ShazamIO: {e}")

# Parche aislado para versiones antiguas de shazamio con espacios en ShazamUrl.
# Inofensivo y omitido en shazamio >= 0.9.0 (motor Rust shazamio-core).
if Shazam is not None:
    try:
        from shazamio.misc import ShazamUrl  # type: ignore
        for _attr in dir(ShazamUrl):
            if not _attr.startswith('__'):
                _val = getattr(ShazamUrl, _attr)
                if isinstance(_val, str) and ' ' in _val:
                    setattr(ShazamUrl, _attr, _val.replace(' ', ''))
    except Exception:
        pass


USER_AGENTS_POOL = [
    'Shazam/3379 CFNetwork/1494.0.7 Darwin/23.4.0',
    'Shazam/3382 CFNetwork/1498.7 Darwin/23.5.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
]


class ShazamRecognitionService:
    """
    Servicio de reconocimiento acústico inteligente multi-motor alimentado por:
    1. ShazamIO 0.9+ Precision Engine (Rust core, acondicionamiento DSP 16kHz vía FFmpeg
       en pase único y escaneo multi-segmento orientado a drops/breakdowns de DJ)
    2. AudD Music Recognition API (respaldo alternativo para tokens de usuario)
    3. Apple Music / iTunes Acoustic Intelligence Fallback (búsqueda de metadatos HD)
    """

    def __init__(self) -> None:
        self._executor = concurrent.futures.ThreadPoolExecutor(
            max_workers=2,
            thread_name_prefix="ShazamWorker"
        )
        self._cache: Dict[str, Tuple[float, Dict[str, Any]]] = {}
        self._lock = threading.Lock()

    def __del__(self) -> None:
        try:
            if hasattr(self, '_executor') and self._executor:
                self._executor.shutdown(wait=False)
        except Exception:
            pass

    def _obtener_audio_hash(self, target: Any) -> Optional[str]:
        """Calcula hash MD5 combinando tamaño + inicio + centro + final para evitar colisiones por cabeceras ID3."""
        try:
            h = hashlib.md5()
            if isinstance(target, (bytes, bytearray)):
                n = len(target)
                h.update(str(n).encode('ascii'))
                h.update(target[:16384])
                if n > 32768:
                    mid = n // 2
                    h.update(target[mid:mid + 16384])
                    h.update(target[-16384:])
                return h.hexdigest()
            elif isinstance(target, str) and os.path.exists(target):
                size = os.path.getsize(target)
                h.update(str(size).encode('ascii'))
                with open(target, 'rb') as f:
                    h.update(f.read(16384))
                    if size > 32768:
                        f.seek(size // 2)
                        h.update(f.read(16384))
                        f.seek(max(0, size - 16384))
                        h.update(f.read(16384))
                return h.hexdigest()
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
                if time.time() - ts < 3600:
                    cached_copy = dict(res)
                    cached_copy["de_cache"] = True
                    return cached_copy
                del self._cache[audio_hash]
        return None

    def _guardar_cache(self, audio_hash: Optional[str], result: Dict[str, Any]) -> None:
        """Almacena solo resultados acústicos válidos (excluyendo fallbacks de solo metadatos de nombre)."""
        if not audio_hash or not result or result.get("status") != "ok":
            return
        if result.get("motor_usado") == "Metadatos de Archivo / Tag ID3":
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
                    loop.run_until_complete(asyncio.sleep(0.05))
                    loop.close()
                except Exception:
                    pass

        future = self._executor.submit(runner)
        # Margen superior al timeout interno asyncio.wait_for (10s x máx 2 intentos) para que siempre cancele dentro del loop
        return future.result(timeout=26.0)

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
            cmd = [
                'ffprobe', '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                filepath
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10)
            val = res.stdout.strip()
            if val and val != 'N/A':
                return float(val)
        except Exception:
            pass
        return 0.0

    def _analizar_energia_wav(self, wav_path: str) -> Tuple[float, float]:
        """
        Calcula (dBFS, RMS) en escala PCM 16-bit de forma nativa (NumPy o stdlib).
        Devuelve (-96.0, 0.0) si el archivo está vacío o corrupto.
        """
        try:
            with wave.open(wav_path, 'rb') as wf:
                sampwidth = wf.getsampwidth()
                nframes = wf.getnframes()
                if sampwidth != 2 or nframes == 0:
                    return (-20.0, 3000.0)
                raw = wf.readframes(min(nframes, 44100 * 15))
            if not raw:
                return (-96.0, 0.0)

            if np is not None:
                samples = np.frombuffer(raw, dtype='<i2').astype(np.float64)
                if samples.size == 0:
                    return (-96.0, 0.0)
                rms = float(np.sqrt(np.mean(samples * samples)))
            else:
                arr = array.array('h')
                arr.frombytes(raw)
                if sys.byteorder == 'big':
                    arr.byteswap()
                step = max(1, len(arr) // 50000)
                sliced = arr[::step]
                if not sliced:
                    return (-96.0, 0.0)
                rms = math.sqrt(sum(s * s for s in sliced) / len(sliced))

            if rms <= 1e-6:
                return (-96.0, 0.0)
            dbfs = 20.0 * math.log10(rms / 32768.0)
            return (dbfs, rms)
        except Exception as e:
            print(f"[RECOGNITION] Error midiendo energía WAV: {e}")
            return (-20.0, 3000.0)

    def _construir_filtro_dsp(self, environment: str = "studio", normalize_audio: bool = True) -> str:
        """
        Construye cadena de filtros FFmpeg para maximizar relación señal/ruido del fingerprinting:
        - Club: HPF 120Hz para eliminar bola de subgraves / saturación de PA.
        - Studio: HPF 35Hz para limpiar DC offset y rumble sub-audible.
        """
        env = (environment or "studio").lower().strip()
        hpf = 120 if env == "club" else 35
        filters = [f"highpass=f={hpf}"]
        if normalize_audio:
            filters.append("dynaudnorm=f=150:g=15:p=0.95:m=10.0")
        return ",".join(filters)

    def _preparar_wav_reconocimiento(
        self,
        input_path: str,
        start_sec: float = 0.0,
        duration_sec: float = 12.0,
        environment: str = "studio",
        sample_rate: int = 16000,
        channels: int = 1,
        normalize_audio: bool = True
    ) -> Optional[str]:
        """
        Extrae un segmento WAV PCM 16-bit limpio optimizado para reconocimiento acústico.
        Usa fast seeking (-ss antes de -i) para extraer drops en pistas largas en <100ms.
        """
        out_path: Optional[str] = None
        try:
            tmp = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
            out_path = tmp.name
            tmp.close()

            af = self._construir_filtro_dsp(environment=environment, normalize_audio=normalize_audio)
            cmd = ['ffmpeg', '-y', '-loglevel', 'error']
            if start_sec > 0.0:
                cmd.extend(['-ss', f"{float(start_sec):.3f}"])
            cmd.extend([
                '-i', input_path,
                '-t', f"{float(duration_sec):.3f}",
                '-vn',
                '-af', af,
                '-ar', str(sample_rate),
                '-ac', str(channels),
                '-c:a', 'pcm_s16le',
                out_path
            ])
            res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True, timeout=20)
            if res.returncode == 0 and os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
                return out_path
            if res.stderr:
                print(f"[RECOGNITION] FFmpeg error en segmento {start_sec:.1f}s: {res.stderr.strip()[:200]}")
            if out_path and os.path.exists(out_path):
                os.remove(out_path)
        except Exception as e:
            print(f"[RECOGNITION] Error preparando WAV: {e}")
            if out_path and os.path.exists(out_path):
                try:
                    os.remove(out_path)
                except Exception:
                    pass
        return None

    def _extraer_fragmento_wav(
        self,
        input_path: str,
        start_sec: float,
        duration_sec: float = 12.0,
        environment: str = "studio"
    ) -> Optional[str]:
        """Extrae un fragmento WAV limpio de 44.1kHz estéreo (mantiene contrato con AudD y tests)."""
        return self._preparar_wav_reconocimiento(
            input_path=input_path,
            start_sec=start_sec,
            duration_sec=duration_sec,
            environment=environment,
            sample_rate=44100,
            channels=2,
            normalize_audio=False
        )

    def _guardar_bytes_temporales(self, raw_bytes: bytes, filename: str = "") -> Optional[str]:
        """Persiste bytes de audio respetando su formato real sin truncar la duración de pistas largas."""
        try:
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
                if ext in ['.aac', '.wma', '.aiff', '.aif']:
                    suffix = ext

            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f_in:
                f_in.write(raw_bytes)
                return f_in.name
        except Exception as e:
            print(f"[RECOGNITION] Error guardando bytes temporales: {e}")
            return None

    def _convertir_bytes_a_wav(self, raw_bytes: bytes, filename: str = "") -> Optional[str]:
        """Convierte cualquier flujo de bytes de audio a archivo WAV temporal limpio sin truncar pistas largas."""
        in_path = self._guardar_bytes_temporales(raw_bytes, filename=filename)
        if not in_path:
            return None
        out_path: Optional[str] = None
        try:
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f_out:
                out_path = f_out.name

            cmd = [
                'ffmpeg', '-y', '-loglevel', 'error',
                '-i', in_path,
                '-vn',
                '-ar', '44100',
                '-ac', '2',
                '-c:a', 'pcm_s16le',
                out_path
            ]
            res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True, timeout=30)
            if res.returncode == 0 and os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
                return out_path
            if res.stderr:
                print(f"[RECOGNITION] Error FFmpeg convirtiendo bytes a WAV: {res.stderr.strip()[:200]}")
            if out_path and os.path.exists(out_path):
                os.remove(out_path)
        except Exception as e:
            print(f"[RECOGNITION] Error convirtiendo bytes a WAV: {e}")
            if out_path and os.path.exists(out_path):
                try:
                    os.remove(out_path)
                except Exception:
                    pass
        finally:
            if in_path and os.path.exists(in_path):
                try:
                    os.remove(in_path)
                except Exception:
                    pass
        return None

    async def _cerrar_cliente_shazam(self, shz: Any) -> None:
        """Cierra de forma segura cualquier sesión HTTP interna de ShazamIO si quedó abierta."""
        for obj in (shz, getattr(shz, 'http_client', None)):
            if obj is None:
                continue
            close_fn = getattr(obj, 'close', None)
            if callable(close_fn):
                try:
                    res = close_fn()
                    if asyncio.iscoroutine(res):
                        await res
                except Exception:
                    pass

    async def _shazam_recognize_async(
        self,
        target: Any,
        environment: str = "studio",
        already_prepared: bool = False,
        request_timeout: float = 10.0
    ) -> Dict[str, Any]:
        """
        Reconocimiento acústico ShazamIO compatible con 0.9+ (recognize / Rust core)
        y versiones previas (recognize_song), con cancelación cooperativa vía asyncio.wait_for.
        """
        if Shazam is None:
            return {"matches": [], "error": _SHAZAM_IMPORT_ERROR or "ShazamIO no instalado"}

        temp_files: List[str] = []
        shz: Any = None
        try:
            source_path: Optional[str] = None
            if isinstance(target, str) and os.path.exists(target):
                source_path = target
            elif isinstance(target, (bytes, bytearray)):
                saved = self._guardar_bytes_temporales(bytes(target))
                if saved:
                    temp_files.append(saved)
                    source_path = saved

            if not source_path:
                return {"matches": []}

            if already_prepared:
                recognition_target = source_path
            else:
                prepared_wav = self._preparar_wav_reconocimiento(
                    input_path=source_path,
                    start_sec=0.0,
                    duration_sec=12.0,
                    environment=environment,
                    sample_rate=16000,
                    channels=1,
                    normalize_audio=True
                )
                if prepared_wav:
                    temp_files.append(prepared_wav)
                    recognition_target = prepared_wav
                else:
                    recognition_target = source_path

            shz = Shazam()
            recognize_fn = getattr(shz, 'recognize', None) or getattr(shz, 'recognize_song', None)
            if not callable(recognize_fn):
                return {"matches": [], "error": "API de ShazamIO incompatible"}

            try:
                result = await asyncio.wait_for(recognize_fn(recognition_target), timeout=request_timeout)
            except asyncio.TimeoutError:
                return {"matches": [], "timed_out": True}

            if isinstance(result, dict) and result.get("matches"):
                return result

            if not already_prepared:
                dur = self._obtener_duracion_archivo(source_path)
                if dur >= 7.0:
                    offset_wav = self._preparar_wav_reconocimiento(
                        input_path=source_path,
                        start_sec=2.5,
                        duration_sec=12.0,
                        environment=environment,
                        sample_rate=16000,
                        channels=1,
                        normalize_audio=True
                    )
                    if offset_wav:
                        temp_files.append(offset_wav)
                        try:
                            result2 = await asyncio.wait_for(recognize_fn(offset_wav), timeout=request_timeout)
                            if isinstance(result2, dict) and result2.get("matches"):
                                return result2
                        except asyncio.TimeoutError:
                            return {"matches": [], "timed_out": True}

            return result if isinstance(result, dict) else {"matches": []}
        except Exception as e:
            err_str = f"{type(e).__name__}: {e}"
            print(f"[SHAZAM ASYNC ERROR] {err_str}")
            if "429" in err_str or "Too Many Requests" in err_str:
                return {"matches": [], "rate_limited": True}
            return {"matches": [], "error": err_str}
        finally:
            if shz is not None:
                await self._cerrar_cliente_shazam(shz)
            for tf in temp_files:
                if tf and os.path.exists(tf):
                    try:
                        os.remove(tf)
                    except Exception:
                        pass

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
            if cover_url and "{w}x{h}" in cover_url:
                cover_url = cover_url.replace("{w}x{h}", "1400x1400")

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
        lyrics: List[str] = []

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

        genre_clean = genre_name or "Electronic"
        year_str = f" [{released_year}]" if released_year else ""
        tactical_comment = f"[{genre_clean}{year_str}] Intro limpia 32b • Drop contundente • Entrada ideal para mezcla armónica"

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
            "comment": tactical_comment,
            "comentario": tactical_comment,
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
                cover_url = artwork.get("url", "").replace("{w}x{h}", "1400x1400")

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

        genre_clean = genre_name or "Electronic"
        year_str = f" [{year}]" if year else ""
        tactical_comment = f"[{genre_clean}{year_str}] Intro limpia 32b • Drop contundente • Entrada ideal para mezcla armónica"

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
            "comment": tactical_comment,
            "comentario": tactical_comment,
            "raw": result,
            "motor_usado": "AudD Music API"
        }

    def buscar_metadatos_itunes_fallback(
        self,
        file_path_or_tags: Any,
        original_filename: str = ""
    ) -> Optional[Dict[str, Any]]:
        """
        Búsqueda de respaldo en catálogo oficial Apple Music / iTunes por metadatos ID3 o nombre de archivo.
        Bloqueado automáticamente para capturas de micrófono con nombres genéricos.
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
                    fn_base_lower = base.lower()
                    if not any(g in fn_base_lower for g in ['shazam_hw_mic', 'tmp', 'mic_sample']):
                        for s in ['[FREE DOWNLOAD]', '[FREE]', '(OFFICIAL AUDIO)', '(OFFICIAL VIDEO)', '320KBPS', '128KBPS', 'FLAC', 'MP3']:
                            base = base.replace(s, '').replace(s.lower(), '')
                        if ' - ' in base:
                            parts = base.split(' - ', 1)
                            artist = parts[0].strip()
                            title = parts[1].strip()
            elif isinstance(file_path_or_tags, dict):
                title = file_path_or_tags.get("title")
                artist = file_path_or_tags.get("artist")

            fn_lower = (original_filename or '').lower()
            es_nombre_generico = any(gen in fn_lower for gen in [
                'mic_sample', 'recording', 'grabacion', 'grabación', 'audio_chunk',
                'blob', 'input_mic', 'sample_temp', 'mic.', 'mic_test', 'captura',
                'shazam_hw_mic', 'phase2_rescue'
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
            with urllib.request.urlopen(req, timeout=5, context=_SSL_CONTEXT) as resp:
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
                        "cover": str(item.get('artworkUrl100', '')).replace('100x100bb', '1400x1400bb'),
                        "preview_url": item.get('previewUrl', ''),
                        "shazam_url": item.get('trackViewUrl', ''),
                        "apple_music_url": item.get('trackViewUrl', ''),
                        "lyrics": [],
                        "spotify_query": f"{item.get('trackName')} {item.get('artistName')}",
                        "raw": item,
                        "motor_usado": "Apple Music Intelligence"
                    }

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

    def reconocer_shazamio(
        self,
        target: Any,
        filepath_context: Optional[str] = None,
        environment: str = "club"
    ) -> Dict[str, Any]:
        """
        Ejecuta reconocimiento acústico nativo ShazamIO con escaneo multi-segmento DJ:
        - Pistas DJ largas (>= 90s): prioriza Drop (28%), Breakdown (52%), 2º Drop (72%) y luego Inicio (0s).
        - Clips/Micrófono (< 90s): escanea inicio (0s) y segmentos adicionales si supera 25s.
        """
        if Shazam is None:
            return {
                "status": "error",
                "msg": f"Biblioteca ShazamIO no disponible ({_SHAZAM_IMPORT_ERROR or 'instala shazamio'})"
            }

        try:
            context_file = (
                filepath_context
                if (filepath_context and os.path.exists(filepath_context))
                else (target if (isinstance(target, str) and os.path.exists(target)) else None)
            )
            dur = self._obtener_duracion_archivo(context_file) if context_file else 0.0

            if context_file and dur >= 90.0:
                segments: List[Tuple[str, Optional[float]]] = [
                    ("Shazam (Drop 28%)", dur * 0.28),
                    ("Shazam (Breakdown 52%)", dur * 0.52),
                    ("Shazam (Drop 72%)", dur * 0.72),
                    ("Radar Acústico Shazam", 0.0),
                ]
            else:
                segments = [("Radar Acústico Shazam", None)]
                if context_file and dur >= 25.0:
                    segments.append(("Shazam (Drop Acústico)", dur * 0.28))
                    segments.append(("Shazam (Breakdown Melódico)", dur * 0.52))

            last_norm: Dict[str, Any] = {"status": "no_match", "msg": "Pista no identificada en Shazam."}
            consecutive_timeouts = 0

            for idx, (label, start_sec) in enumerate(segments):
                if idx > 0:
                    # Pacing anti-429 entre segmentos consecutivos
                    time.sleep(0.35)

                slice_path: Optional[str] = None
                try:
                    if start_sec is None:
                        scan_target = target
                        is_prepared = False
                    else:
                        slice_path = self._preparar_wav_reconocimiento(
                            input_path=context_file,  # type: ignore[arg-type]
                            start_sec=start_sec,
                            duration_sec=12.0,
                            environment=environment,
                            sample_rate=16000,
                            channels=1,
                            normalize_audio=True
                        )
                        if not slice_path:
                            continue
                        scan_target = slice_path
                        is_prepared = True

                    raw = self._ejecutar_async(
                        self._shazam_recognize_async,
                        scan_target,
                        environment,
                        is_prepared,
                        10.0
                    )
                    if raw and raw.get("rate_limited"):
                        return {
                            "status": "rate_limited",
                            "msg": "Servidor Shazam con límite de tasa (429). Conmutando a motor alternativo."
                        }
                    if raw and raw.get("timed_out"):
                        consecutive_timeouts += 1
                        if consecutive_timeouts >= 2:
                            return {
                                "status": "no_match",
                                "msg": "Tiempo de espera agotado en Shazam (posible throttling temporal)."
                            }
                        continue

                    consecutive_timeouts = 0
                    norm = self.normalizar_resultado_shazam(raw)
                    if norm.get("status") == "ok":
                        norm["motor_usado"] = label
                        return norm
                    last_norm = norm
                finally:
                    if slice_path and os.path.exists(slice_path):
                        try:
                            os.remove(slice_path)
                        except Exception:
                            pass

            return last_norm
        except Exception as e:
            err_detail = f"{type(e).__name__}: {e}"
            print(f"[SHAZAM ERROR] Reconocimiento Shazam falló: {err_detail}")
            return {"status": "error", "msg": f"Error Shazam: {err_detail}"}

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
                    start = dur * 0.28 if dur > 40 else 0.0
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

            resp = requests.post(
                url,
                data=data,
                files=files,
                timeout=18,
                verify=_CA_BUNDLE if _CA_BUNDLE else True
            )
            if resp.status_code != 200:
                return {"status": "error", "msg": f"AudD HTTP {resp.status_code}: {resp.text[:100]}"}

            res_json = resp.json()
            return self.normalizar_resultado_audd(res_json)
        except Exception as e:
            print(f"[AUDD ERROR] {e}")
            return {"status": "error", "msg": f"Error AudD: {e}"}
        finally:
            if file_to_close:
                try:
                    file_to_close.close()
                except Exception:
                    pass
            if slice_temp_to_remove and os.path.exists(slice_temp_to_remove):
                try:
                    os.remove(slice_temp_to_remove)
                except Exception:
                    pass

    def reconocer_archivo(
        self,
        filepath: str,
        motor: str = "hybrid",
        audd_token: str = "",
        environment: str = "studio"
    ) -> Dict[str, Any]:
        """Identifica una pista a partir de la ruta de un archivo local usando el motor seleccionado."""
        if not filepath or not os.path.exists(filepath):
            return {"status": "error", "msg": "Archivo no encontrado"}

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

        res_shazam = self.reconocer_shazamio(filepath, filepath_context=filepath, environment=environment)
        if res_shazam.get("status") == "ok":
            self._guardar_cache(audio_hash, res_shazam)
            return res_shazam

        if motor in ("hybrid", "radar_edge"):
            token_to_use = audd_token.strip() if (audd_token and audd_token.strip()) else "test"
            res_audd = self.reconocer_audd(filepath, audd_token=token_to_use)
            if res_audd.get("status") == "ok":
                self._guardar_cache(audio_hash, res_audd)
                return res_audd

        res_itunes = self.buscar_metadatos_itunes_fallback(filepath, original_filename=os.path.basename(filepath))
        if res_itunes and res_itunes.get("status") == "ok":
            self._guardar_cache(audio_hash, res_itunes)
            return res_itunes

        return {
            "status": "no_match",
            "msg": res_shazam.get("msg") or "No se encontraron coincidencias acústicas ni en Shazam ni en el catálogo de referencia."
        }

    def reconocer_bytes(
        self,
        audio_bytes: bytes,
        motor: str = "hybrid",
        audd_token: str = "",
        filename: str = "",
        environment: str = "club"
    ) -> Dict[str, Any]:
        """Identifica una pista a partir de bytes binarios de audio en memoria (subidas Web o grabaciones de micro)."""
        if not audio_bytes or len(audio_bytes) < 300:
            return {"status": "error", "msg": "Datos de audio insuficientes"}

        audio_hash = self._obtener_audio_hash(audio_bytes)
        cached = self._consultar_cache(audio_hash)
        if cached:
            return cached

        motor = (motor or "hybrid").lower().strip()
        raw_path = self._guardar_bytes_temporales(audio_bytes, filename=filename)
        check_wav: Optional[str] = None

        try:
            if not raw_path:
                return {"status": "error", "msg": "No se pudo escribir buffer temporal de audio."}

            fn_lower = (filename or "").lower()
            es_micro = any(tag in fn_lower for tag in ['mic_sample', 'recording', 'captura', 'input_mic'])
            if es_micro:
                check_wav = self._preparar_wav_reconocimiento(
                    input_path=raw_path,
                    start_sec=0.0,
                    duration_sec=12.0,
                    environment=environment,
                    sample_rate=16000,
                    channels=1,
                    normalize_audio=False
                )
                if check_wav and os.path.exists(check_wav):
                    dbfs, rms = self._analizar_energia_wav(check_wav)
                    if dbfs < -52.0 or rms < 45.0:
                        return {
                            "status": "silence",
                            "msg": f"⚠️ Señal de micrófono inaudible o en silencio ({dbfs:.1f} dBFS). Acerca la fuente de sonido o verifica los permisos de entrada en Ajustes de macOS > Privacidad > Micrófono."
                        }

            if motor == "audd":
                token_to_use = audd_token.strip() if (audd_token and audd_token.strip()) else "test"
                res = self.reconocer_audd(raw_path, audd_token=token_to_use)
                if res.get("status") == "ok":
                    self._guardar_cache(audio_hash, res)
                return res

            res_shazam = self.reconocer_shazamio(raw_path, filepath_context=raw_path, environment=environment)
            if res_shazam.get("status") == "ok":
                self._guardar_cache(audio_hash, res_shazam)
                return res_shazam

            if motor in ("hybrid", "radar_edge"):
                token_to_use = audd_token.strip() if (audd_token and audd_token.strip()) else "test"
                res_audd = self.reconocer_audd(raw_path, audd_token=token_to_use)
                if res_audd.get("status") == "ok":
                    self._guardar_cache(audio_hash, res_audd)
                    return res_audd

            res_itunes = self.buscar_metadatos_itunes_fallback(raw_path, original_filename=filename)
            if res_itunes and res_itunes.get("status") == "ok":
                self._guardar_cache(audio_hash, res_itunes)
                return res_itunes

            return {
                "status": "no_match",
                "msg": res_shazam.get("msg") or "No se encontraron coincidencias acústicas para este fragmento de audio."
            }
        finally:
            for p in (raw_path, check_wav):
                if p and os.path.exists(p):
                    try:
                        os.remove(p)
                    except Exception:
                        pass

    def reconocer_base64(
        self,
        b64_str: str,
        motor: str = "hybrid",
        audd_token: str = "",
        filename: str = "",
        environment: str = "club"
    ) -> Dict[str, Any]:
        """Identifica una pista recibiendo audio codificado en Base64."""
        if not b64_str or not isinstance(b64_str, str):
            return {"status": "error", "msg": "Audio Base64 no proporcionado"}

        try:
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            audio_bytes = base64.b64decode(b64_str)
            return self.reconocer_bytes(
                audio_bytes,
                motor=motor,
                audd_token=audd_token,
                filename=filename,
                environment=environment
            )
        except Exception as e:
            print(f"[RECOGNITION ERROR] Decodificación Base64 falló: {e}")
            return {"status": "error", "msg": f"Error procesando audio: {e}"}

    def grabar_microfono_sistema(
        self,
        duration_sec: int = 7,
        motor: str = "hybrid",
        audd_token: str = "",
        environment: str = "club"
    ) -> Dict[str, Any]:
        """
        Graba directamente desde el micrófono de hardware del sistema (macOS AVFoundation, Linux Pulse, Windows DShow)
        mediante FFmpeg y ejecuta el reconocimiento acústico.
        """
        duration = max(3, min(15, int(duration_sec or 7)))
        temp_wav = os.path.join(tempfile.gettempdir(), f"shazam_hw_mic_{uuid.uuid4().hex[:8]}.wav")

        try:
            ffmpeg_cmd = None
            if sys.platform == 'darwin':
                ffmpeg_cmd = [
                    'ffmpeg', '-y', '-f', 'avfoundation',
                    '-i', ':default',
                    '-t', str(duration),
                    '-ar', '44100', '-ac', '1',
                    temp_wav
                ]
            elif sys.platform.startswith('linux'):
                ffmpeg_cmd = [
                    'ffmpeg', '-y', '-f', 'pulse',
                    '-i', 'default',
                    '-t', str(duration),
                    '-ar', '44100', '-ac', '1',
                    temp_wav
                ]
            elif sys.platform == 'win32':
                ffmpeg_cmd = [
                    'ffmpeg', '-y', '-f', 'dshow',
                    '-i', 'audio=Microphone',
                    '-t', str(duration),
                    '-ar', '44100', '-ac', '1',
                    temp_wav
                ]

            if not ffmpeg_cmd:
                return {"status": "error", "msg": f"Captura directa no soportada en la plataforma {sys.platform}"}

            proc = subprocess.run(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=duration + 5)

            if proc.returncode != 0 and sys.platform == 'darwin':
                for alt_dev in [':0', ':1']:
                    alt_cmd = [
                        'ffmpeg', '-y', '-f', 'avfoundation',
                        '-i', alt_dev, '-t', str(duration),
                        '-ar', '44100', '-ac', '1', temp_wav
                    ]
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

            dbfs, rms = self._analizar_energia_wav(temp_wav)
            if dbfs < -52.0 or rms < 45.0:
                return {
                    "status": "silence",
                    "msg": f"⚠️ Micrófono de hardware en silencio ({dbfs:.1f} dBFS). Revisa permisos en Ajustes de macOS > Privacidad > Micrófono."
                }

            res = self.reconocer_archivo(temp_wav, motor=motor, audd_token=audd_token, environment=environment)
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