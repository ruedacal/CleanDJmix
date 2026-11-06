import os
import re
import time
import json
import urllib.parse
import subprocess
import threading
import random
import requests
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from infrastructure.audio_processor import AudioProcessorService
from services.track_matcher import TrackMatcher

CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config_ingest.json")


class SpotifyFlacIngestService:
    """
    Motor nativo para:
    1. Extracción de metadatos oficiales, ISRC, BPM y Key Camelot.
    2. Negociación directa con SuperFLAC (CSRF/XSRF + HTMX) usando Apple Music URLs.
    3. Gestión resiliente de códigos 403/409/429, volcado por chunks, conversión multi-formato y etiquetado Pro.
    """

    def __init__(self):
        self.config = self._cargar_config()
        self.sp = self._inicializar_spotipy()
        self.session = requests.Session()
        self._csrf_token = ""
        self._negotiation_lock = threading.Lock()
        self._last_negotiation_time = 0.0
        self._inicializar_sesion_superflac(force_refresh=True)

    def _cargar_config(self) -> dict:
        default_cfg = {
            "spotify_client_id": os.getenv("SPOTIPY_CLIENT_ID", ""),
            "spotify_client_secret": os.getenv("SPOTIPY_CLIENT_SECRET", ""),
            "superflac_cookie": os.getenv("SUPERFLAC_COOKIE", ""),
            "superflac_token": os.getenv("SUPERFLAC_TOKEN", ""),
            "download_dir": os.path.expanduser("~/Music/mi musica")
        }
        if os.path.exists(CONFIG_PATH):
            try:
                with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                    saved = json.load(f)
                    default_cfg.update({k: v for k, v in saved.items() if v})
            except Exception:
                pass
        return default_cfg

    def _inicializar_sesion_superflac(self, force_refresh=True):
        self.session.headers.update({
            "accept": "*/*",
            "accept-language": "es-ES,es;q=0.9,en-ES;q=0.8,en;q=0.7",
            "origin": "https://superflac.com",
            "referer": "https://superflac.com/search?source=all&type=all&query=https%3A%2F%2Fsuperflac.com%2F",
            "sec-ch-ua": '"Google Chrome";v="155", "Chromium";v="155", "Not(A:Brand";v="24"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"macOS"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36"
        })

        try:
            print("[SUPERFLAC] Sincronizando sesión y token CSRF con superflac.com...")
            r = self.session.get("https://superflac.com/", timeout=12)
            if r.status_code == 200:
                m = re.search(r'name="_token"\s+value="([^"]+)"', r.text) or re.search(r'csrf-token"\s+content="([^"]+)"', r.text)
                if m:
                    self._csrf_token = m.group(1)
                    print(f"[SUPERFLAC] Token CSRF activo sincronizado: {self._csrf_token[:12]}...")
        except Exception as e:
            print(f"[SUPERFLAC WARN] Fallo al sincronizar sesión fresca de superflac: {e}")

    def _inicializar_spotipy(self):
        cid = self.config.get("spotify_client_id", "").strip()
        secret = self.config.get("spotify_client_secret", "").strip()
        if not cid or not secret:
            return None
        try:
            auth_manager = SpotifyClientCredentials(client_id=cid, client_secret=secret)
            return spotipy.Spotify(auth_manager=auth_manager, requests_timeout=15)
        except Exception as e:
            print(f"[SpotifyFlacIngest] Error iniciando Spotipy: {e}")
            return None

    def _resolver_apple_music_url(self, artist: str, title: str, music_url_actual: str = "", meta_track: dict = None) -> str:
        if music_url_actual and "music.apple.com" in music_url_actual:
            return music_url_actual.split("&uo=")[0]
        try:
            q = urllib.parse.quote(f"{artist} {title}")
            url = f"https://itunes.apple.com/search?term={q}&country=es&entity=song&limit=8"
            r = requests.get(url, timeout=8)
            if r.status_code == 200:
                results = r.json().get("results", [])
                if results:
                    # Si no hay metadatos para comparar, fallback al primero
                    if not meta_track:
                        track_view = results[0].get("trackViewUrl", "")
                        return track_view.split("&uo=")[0]

                    # Evaluación de Fidelidad con TrackMatcher para asegurar que sea la misma pista y versión
                    pista_referencia = {
                        "artist": artist,
                        "title": title,
                        "duration": meta_track.get("original_duration") or meta_track.get("duration") or "05:00",
                        "bpm": meta_track.get("bpm") or 0.0
                    }

                    candidatos_puntuados = []
                    for res in results:
                        match_info = TrackMatcher.evaluar_coincidencia(pista_referencia, res)
                        candidatos_puntuados.append((match_info["score"], res))

                    candidatos_puntuados.sort(key=lambda x: x[0], reverse=True)
                    mejor_score, mejor_res = candidatos_puntuados[0]

                    # Si el mejor score es menor a 45%, se rechaza la descarga ciega para evitar temas incorrectos
                    if mejor_score < 45:
                        print(f"[SUPERFLAC WARN] Coincidencia de Apple Music muy baja ({mejor_score}%) para '{artist} - {title}'. Descarga evitada para proteger la biblioteca.")
                        return ""

                    track_view = mejor_res.get("trackViewUrl", "")
                    return track_view.split("&uo=")[0]
        except Exception as e:
            print(f"[SUPERFLAC WARN] Error resolviendo Apple Music URL: {e}")
        return ""

    def _resolver_superflac_search(self, artist: str, title: str) -> str:
        """Busca directamente en superflac.com para obtener URLs de streaming válidas (Deezer/Qobuz)."""
        try:
            q = urllib.parse.quote(f"{artist} {title}")
            url = f"https://superflac.com/search?source=all&type=all&query={q}"
            r = self.session.get(url, timeout=16)
            if r.status_code == 200:
                forms = re.findall(r'<form[^>]*>(.*?)</form>', r.text, re.DOTALL)
                for f in forms[1:]:
                    m_url = re.search(r'name="music_url"\s+value="([^"]+)"', f)
                    if m_url:
                        cand = m_url.group(1).strip()
                        if cand:
                            print(f"[SUPERFLAC] URL resuelta por búsqueda directa: {cand}")
                            return cand
        except Exception as e:
            print(f"[SUPERFLAC WARN] Error buscando pista en superflac search: {e}")
        return ""

    def _solicitar_descarga_segura(self, music_url: str, quality: str = "FLAC") -> tuple:
        """Negociación protegida por Mutex/Lock y espaciado temporal (Jitter) para
        garantizar cero colisiones HTTP 409 y cero bloqueos HTTP 429."""
        with self._negotiation_lock:
            ahora = time.time()
            delta = ahora - self._last_negotiation_time
            intervalo_minimo = 1.2 + random.uniform(0.1, 0.3)
            if delta < intervalo_minimo:
                time.sleep(intervalo_minimo - delta)

            res_obj, status_code, info_msg = self._solicitar_descarga_superflac(music_url, quality=quality)
            self._last_negotiation_time = time.time()

            # Si falla con 422 por calidad (FLAC_HIRES no soportado en este proveedor), fallback automático a FLAC standard
            if status_code == 422 and quality == "FLAC_HIRES":
                print(f"[SUPERFLAC] FLAC_HIRES no soportado por este proveedor. Fallback a FLAC Lossless CD...")
                time.sleep(1.0)
                res_obj, status_code, info_msg = self._solicitar_descarga_superflac(music_url, quality="FLAC")
                self._last_negotiation_time = time.time()

            # Recuperación proactiva contra 403, 409 y 429
            if status_code in (403, 419):
                print(f"[SUPERFLAC] Sesión expirada ({status_code}). Forzando refresco de tokens...")
                self._inicializar_sesion_superflac(force_refresh=True)
                time.sleep(1.0)
                res_obj, status_code, info_msg = self._solicitar_descarga_superflac(music_url, quality="FLAC" if quality == "FLAC_HIRES" else quality)
                self._last_negotiation_time = time.time()
            elif status_code == 409:
                print("[SUPERFLAC WARN] HTTP 409 Conflicto en cola remota. Esperando 2.5s y refrescando...")
                self._inicializar_sesion_superflac(force_refresh=True)
                time.sleep(2.5)
                res_obj, status_code, info_msg = self._solicitar_descarga_superflac(music_url, quality="FLAC" if quality == "FLAC_HIRES" else quality)
                self._last_negotiation_time = time.time()
            elif status_code == 429:
                print("[SUPERFLAC WARN] HTTP 429 Rate Limit. Aplicando backoff de 4.0s...")
                time.sleep(4.0 + random.uniform(0.5, 1.5))
                res_obj, status_code, info_msg = self._solicitar_descarga_superflac(music_url, quality="FLAC" if quality == "FLAC_HIRES" else quality)
                self._last_negotiation_time = time.time()

            return res_obj, status_code, info_msg

    def _solicitar_descarga_superflac(self, music_url: str, quality: str = "FLAC") -> tuple:
        endpoint = "https://superflac.com/downloads?inline=1"
        headers = {
            "content-type": "application/x-www-form-urlencoded",
            "hx-current-url": "https://superflac.com/search?source=all&type=all&query=https%3A%2F%2Fsuperflac.com%2F",
            "hx-request": "true",
            "hx-target": "dl-btn-0",
            "priority": "u=1, i"
        }
        payload = {
            "_token": self._csrf_token,
            "music_url": music_url,
            "resource_kind": "track",
            "quality": quality
        }

        r = self.session.post(endpoint, headers=headers, data=payload, stream=True, timeout=60)
        status = r.status_code

        if status in (403, 409, 419, 429):
            return None, status, f"HTTP {status} devuelto por SuperFLAC"
        if status == 422:
            return None, 422, "Calidad no soportada por el proveedor"
        if status != 200:
            return None, status, f"Error HTTP inesperado: {status}"

        ctype = r.headers.get("content-type", "").lower()
        if any(x in ctype for x in ["audio", "octet-stream", "flac"]):
            return r, 200, "STREAM_DIRECTO"

        body_text = r.text
        if "track-feedback--error" in body_text:
            m_err = re.search(r'track-feedback--error">([^<]+)<', body_text)
            err_msg = m_err.group(1).strip() if m_err else "Error en proveedor"
            return None, 422, err_msg

        hx_redirect = r.headers.get("HX-Redirect") or r.headers.get("hx-redirect") or r.headers.get("Location")
        if hx_redirect:
            dl_url = hx_redirect if hx_redirect.startswith("http") else f"https://superflac.com{hx_redirect}"
            return dl_url, 200, "URL_EXTRAIDA"

        pat_urls = [
            r'hx-get=["\'](https?://[^"\s>]+)["\']',
            r'hx-get=["\'](/downloads/[^"\s>]+)["\']',
            r'href=["\'](https?://[^"\s>]+(?:file\?[^"\s>]+|download|flac|\.flac|\.m4a|\.mp3|\.wav)[^"\s>]*)["\']',
            r'href=["\'](/downloads/[^"\s>]+)["\']',
            r'url["\']?\s*:\s*["\'](https?://[^"\s>]+)["\']',
            r'(https?://[^\s<>"]+(?:\.flac|/download[^\s<>"]*))'
        ]
        for pat in pat_urls:
            m = re.search(pat, body_text, re.IGNORECASE)
            if m:
                found = m.group(1).replace("&amp;", "&")
                dl_url = found if found.startswith("http") else f"https://superflac.com{found}"
                return dl_url, 200, "URL_EXTRAIDA"

        if body_text.startswith("fLaC"):
            return r, 200, "STREAM_DIRECTO"

        return None, 200, f"No se encontró enlace de descarga en la respuesta HTMX ({len(body_text)} bytes)"

    def _resolver_stream_final(self, url_candidata: str, max_polls: int = 15) -> tuple:
        url_actual = url_candidata
        timeouts_count = 0
        for intento in range(max_polls):
            try:
                is_cdn_file = "/file?" in url_actual or "expires=" in url_actual
                if is_cdn_file:
                    r_dl = self.session.get(url_actual, stream=True, timeout=60, allow_redirects=True)
                    if r_dl.status_code == 200:
                        ctype = r_dl.headers.get("content-type", "").lower()
                        if not any(x in ctype for x in ["html", "json"]):
                            return r_dl, "OK"
                    r_dl.close()

                hdrs = {
                    "hx-request": "true",
                    "hx-current-url": "https://superflac.com/search?source=all&type=all&query=https%3A%2F%2Fsuperflac.com%2F",
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                }

                time.sleep(1.2)
                r_dl = self.session.get(url_actual, headers=hdrs, timeout=25, allow_redirects=True)
                status = r_dl.status_code

                if status == 429:
                    print(f"[SUPERFLAC WARN] Rate limit (429). Esperando 3s...")
                    time.sleep(3.0)
                    continue

                if status in (403, 409):
                    return None, f"HTTP {status} en pasarela"

                ctype = r_dl.headers.get("content-type", "").lower()
                if status == 200 and not any(x in ctype for x in ["html", "json"]):
                    return r_dl, "OK"

                body = r_dl.text

                # Detección temprana de errores en feedback slot
                if "track-feedback--error" in body or "button--error" in body:
                    m_err = re.search(r'track-feedback--error">([^<]+)<', body)
                    err_msg = m_err.group(1).strip() if m_err else "Error devuelto por el servidor remoto de descarga."
                    print(f"[SUPERFLAC WARN] Servidor reportó: {err_msg}")
                    return None, err_msg

                # Búsqueda del enlace final del fichero (/file?...)
                m_file = re.search(r'href=["\'](https?://[^"\s>]+(?:file\?[^"\s>]+|\.flac|\.wav|\.mp3|\.m4a)[^"\s>]*)["\']', body)
                if not m_file:
                    m_file = re.search(r'href=["\'](/downloads/[^"\s>]+/file\?[^"\s>]*)["\']', body)
                if m_file:
                    cand = m_file.group(1).replace("&amp;", "&")
                    file_url = cand if cand.startswith("http") else f"https://superflac.com{cand}"
                    print(f"[SUPERFLAC] Enlace binario obtenido: {file_url[:80]}...")
                    
                    # Gestión activa de la cola de descarga remota (SuperFLAC Queue & 429/502 Backoff)
                    for q_att in range(4):
                        try:
                            r_stream = self.session.get(file_url, stream=True, timeout=12, allow_redirects=True)
                            if r_stream.status_code == 200:
                                ctype = r_stream.headers.get("content-type", "").lower()
                                if not any(x in ctype for x in ["html", "json"]):
                                    return r_stream, "OK"
                                r_stream.close()
                                break

                            if r_stream.status_code == 429:
                                pos = r_stream.headers.get("x-queue-position", "1")
                                retry_s = float(r_stream.headers.get("retry-after", "2.0"))
                                print(f"[SUPERFLAC QUEUE] En cola de streaming (puesto {pos}). Esperando {retry_s}s (reintento {q_att+1}/4)...")
                                r_stream.close()
                                time.sleep(max(1.5, retry_s))
                            elif r_stream.status_code == 502:
                                print(f"[SUPERFLAC WARN] HTTP 502 en pasarela remota (reintento {q_att+1}/4)...")
                                r_stream.close()
                                time.sleep(1.5)
                            else:
                                r_stream.close()
                                time.sleep(1.2)
                        except Exception as q_err:
                            print(f"[SUPERFLAC WARN] Error de conexión al stream ({q_err}) (reintento {q_att+1}/4)...")
                            time.sleep(1.5)

                    return None, "SuperFLAC no entregó el stream binario en los reintentos"

                # Si aún está procesando (sigue devolviendo hx-get)
                m_hx = re.search(r'hx-get=["\'](https?://[^"\s>]+)["\']', body) or re.search(r'hx-get=["\'](/downloads/[^"\s>]+)["\']', body)
                if m_hx:
                    cand = m_hx.group(1).replace("&amp;", "&")
                    url_actual = cand if cand.startswith("http") else f"https://superflac.com{cand}"
                    continue

            except (requests.exceptions.Timeout, requests.exceptions.ReadTimeout, requests.exceptions.ConnectTimeout) as t_err:
                timeouts_count += 1
                print(f"[SUPERFLAC POLL WARN] Timeout al conectar ({t_err}). Reintento {timeouts_count}/3...")
                if timeouts_count >= 3:
                    return None, "Tiempo de espera agotado al conectar con el servidor SuperFLAC."
                time.sleep(2.0)
            except Exception as e:
                print(f"[SUPERFLAC POLL WARN] Excepción: {e}")
                time.sleep(1.5)

        return None, "Tiempo de espera agotado esperando el binario final en SuperFLAC"

    def descargar_e_inyectar_flac(self, meta_track: dict, directorio_destino: str = None, progress_cb=None) -> dict:
        dest_folder = directorio_destino or self.config.get("download_dir", os.path.expanduser("~/Music/mi musica"))
        os.makedirs(dest_folder, exist_ok=True)

        safe_artist = re.sub(r'[\\/*?:"<>|]', "", meta_track.get("artist", "Artist")).strip()
        safe_title = re.sub(r'[\\/*?:"<>|]', "", meta_track.get("title", "Track")).strip()
        fmt = meta_track.get("format", "flac").lower()

        quality_map = {
            "flac_hires": ("FLAC_HIRES", "flac"),
            "flac": ("FLAC", "flac"),
            "wav": ("FLAC", "wav"),
            "aiff": ("FLAC", "aiff"),
            "mp3": ("MP3_320", "mp3")
        }
        sf_quality, ext_final = quality_map.get(fmt, ("FLAC", "flac"))

        ruta_temp_flac = os.path.join(dest_folder, f"{safe_artist} - {safe_title}.flac")
        ruta_final = os.path.join(dest_folder, f"{safe_artist} - {safe_title}.{ext_final}")

        # 1. Determinar URL candidata a descargar:
        # Prioridad 1: Spotify URL directa si existe en los metadatos o por ID
        music_url = meta_track.get("spotify_url", "").strip()
        if not music_url and meta_track.get("id"):
            tid = str(meta_track["id"]).strip()
            if "spotify.com" in tid:
                music_url = tid
            elif tid.startswith("spotify:track:"):
                music_url = f"https://open.spotify.com/track/{tid.split(':')[-1]}"
            elif len(tid) == 22 and tid.isalnum():
                music_url = f"https://open.spotify.com/track/{tid}"

        # Prioridad 2: Búsqueda directa en superflac.com (Deezer / Qobuz)
        if not music_url:
            music_url = self._resolver_superflac_search(safe_artist, safe_title)

        # Prioridad 3: Apple Music fallback con TrackMatcher
        if not music_url:
            music_url = self._resolver_apple_music_url(
                safe_artist,
                safe_title,
                meta_track.get("apple_url", ""),
                meta_track=meta_track
            )

        if not music_url:
            return {"status": "error", "msg": f"No se encontró enlace descargable para '{safe_artist} - {safe_title}'.", "path": ""}

        print(f"[SUPERFLAC] Solicitando {sf_quality} para URL: {music_url}")

        res_obj, status_code, info_msg = self._solicitar_descarga_segura(music_url, quality=sf_quality)
        if not res_obj:
            # Si falló con esa URL y no habíamos probado la búsqueda de SuperFLAC, intentamos con la búsqueda directa
            if "superflac.com/search" not in music_url and "deezer" not in music_url:
                alt_url = self._resolver_superflac_search(safe_artist, safe_title)
                if alt_url and alt_url != music_url:
                    print(f"[SUPERFLAC] Reintentando con URL alternativa resuelta: {alt_url}")
                    res_obj, status_code, info_msg = self._solicitar_descarga_segura(alt_url, quality="FLAC")
            if not res_obj:
                print(f"[SUPERFLAC FALLO] No se pudo negociar stream ({info_msg}). Activando Fallback Master Engine...")
                try:
                    from infrastructure.flac_ingest_engine import FlacIngestEngine
                    engine = FlacIngestEngine(output_dir=dest_folder)
                    res_engine = engine.descargar_flac_sync(meta_track, formato=ext_final)
                    if res_engine and res_engine.get("status") == "ok" and os.path.exists(res_engine.get("path", "")):
                        print(f"[FALLBACK MASTER OK] Descargado via Master Engine: {res_engine['path']}")
                        return {"status": "ok", "msg": "Descarga completada via Master Engine", "path": res_engine["path"]}
                except Exception as fb_err:
                    print(f"[FALLBACK WARN] Error en Master Engine: {fb_err}")
                return {"status": "error", "msg": info_msg, "path": ""}

        try:
            if info_msg == "URL_EXTRAIDA" and isinstance(res_obj, str):
                print(f"[SUPERFLAC] Resolviendo stream binario desde: {res_obj}...")
                r_stream, err_stream = self._resolver_stream_final(res_obj)
                if not r_stream:
                    print(f"[SUPERFLAC FALLO] SuperFLAC no entregó stream ({err_stream}). Activando Fallback Master Engine...")
                    try:
                        from infrastructure.flac_ingest_engine import FlacIngestEngine
                        engine = FlacIngestEngine(output_dir=dest_folder)
                        res_engine = engine.descargar_flac_sync(meta_track, formato=ext_final)
                        if res_engine and res_engine.get("status") == "ok" and os.path.exists(res_engine.get("path", "")):
                            print(f"[FALLBACK MASTER OK] Descargado via Master Engine: {res_engine['path']}")
                            return {"status": "ok", "msg": "Descarga completada via Master Engine", "path": res_engine["path"]}
                    except Exception as fb_err:
                        print(f"[FALLBACK WARN] Error en Master Engine: {fb_err}")
                    return {"status": "error", "msg": err_stream, "path": ""}
                with r_stream:
                    with open(ruta_temp_flac, "wb") as f:
                        for chunk in r_stream.iter_content(chunk_size=262144):
                            if chunk:
                                f.write(chunk)
            else:
                with open(ruta_temp_flac, "wb") as f:
                    for chunk in res_obj.iter_content(chunk_size=262144):
                        if chunk:
                            f.write(chunk)

            if os.path.exists(ruta_temp_flac):
                with open(ruta_temp_flac, "rb") as check_f:
                    header_snippet = check_f.read(128)
                    if not header_snippet.startswith(b"fLaC") and not header_snippet.startswith(b"ID3") and not (len(header_snippet) >= 2 and header_snippet[0] == 0xFF):
                        os.remove(ruta_temp_flac)
                        print(f"[SUPERFLAC WARN] Cabecera inválida. Activando Fallback Master Engine...")
                        try:
                            from infrastructure.flac_ingest_engine import FlacIngestEngine
                            engine = FlacIngestEngine(output_dir=dest_folder)
                            res_engine = engine.descargar_flac_sync(meta_track, formato=ext_final)
                            if res_engine and res_engine.get("status") == "ok" and os.path.exists(res_engine.get("path", "")):
                                return {"status": "ok", "msg": "Descarga completada via Master Engine", "path": res_engine["path"]}
                        except Exception as fb_err:
                            print(f"[FALLBACK WARN] Error en Master Engine: {fb_err}")
                        return {
                            "status": "error",
                            "msg": f"Cabecera inválida (no es audio reconocido): {header_snippet[:60]}",
                            "path": ""
                        }

            if not os.path.exists(ruta_temp_flac) or os.path.getsize(ruta_temp_flac) < 2048:
                if os.path.exists(ruta_temp_flac):
                    os.remove(ruta_temp_flac)
                print(f"[SUPERFLAC WARN] Archivo vacío o incompleto. Activando Fallback Master Engine...")
                try:
                    from infrastructure.flac_ingest_engine import FlacIngestEngine
                    engine = FlacIngestEngine(output_dir=dest_folder)
                    res_engine = engine.descargar_flac_sync(meta_track, formato=ext_final)
                    if res_engine and res_engine.get("status") == "ok" and os.path.exists(res_engine.get("path", "")):
                        return {"status": "ok", "msg": "Descarga completada via Master Engine", "path": res_engine["path"]}
                except Exception as fb_err:
                    print(f"[FALLBACK WARN] Error en Master Engine: {fb_err}")
                return {"status": "error", "msg": "El archivo devuelto está vacío o incompleto.", "path": ""}

            # Detección de stream nativo para evitar transcodificación innecesaria
            is_mp3_native = False
            if ext_final == "mp3" and os.path.exists(ruta_temp_flac):
                with open(ruta_temp_flac, "rb") as check_f:
                    snip = check_f.read(4)
                    if snip.startswith(b"ID3") or (len(snip) >= 2 and snip[0] == 0xFF and (snip[1] & 0xE0) == 0xE0):
                        is_mp3_native = True

            if ext_final != "flac":
                if is_mp3_native:
                    if ruta_temp_flac != ruta_final:
                        if os.path.exists(ruta_final):
                            os.remove(ruta_final)
                        os.rename(ruta_temp_flac, ruta_final)
                else:
                    cmd_ff = ["ffmpeg", "-y", "-i", ruta_temp_flac]
                    if ext_final == "mp3":
                        cmd_ff += ["-ab", "320k", "-map_metadata", "0", "-id3v2_version", "3", ruta_final]
                    elif ext_final == "aiff":
                        cmd_ff += ["-c:a", "pcm_s24be", "-write_id3v2", "1", ruta_final]
                    elif ext_final == "wav":
                        cmd_ff += ["-c:a", "pcm_s24le", ruta_final]
                    else:
                        cmd_ff += [ruta_final]
                    subprocess.run(cmd_ff, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    if os.path.exists(ruta_final) and os.path.getsize(ruta_final) > 2048:
                        os.remove(ruta_temp_flac)
                    else:
                        ruta_final = ruta_temp_flac
            else:
                ruta_final = ruta_temp_flac

            try:
                if hasattr(AudioProcessorService, "escribir_metadatos_pro"):
                    AudioProcessorService.escribir_metadatos_pro(
                        ruta_final,
                        meta_track,
                        cover_url=meta_track.get("cover_url")
                    )
            except Exception as e_meta:
                print(f"[META WARN] {e_meta}")

            return {
                "status": "ok",
                "msg": f"Descarga {sf_quality} completada",
                "path": ruta_final
            }
        except Exception as e:
            if os.path.exists(ruta_temp_flac):
                os.remove(ruta_temp_flac)
            return {"status": "error", "msg": str(e), "path": ""}
