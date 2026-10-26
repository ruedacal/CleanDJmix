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
        self._csrf_token = "H23AezPwrrB3Eh1rQzNwaL4o0hqBEvCpmnIosJFu"
        self._negotiation_lock = threading.Lock()
        self._last_negotiation_time = 0.0
        self._inicializar_sesion_superflac()

    def _cargar_config(self) -> dict:
        default_cfg = {
            "spotify_client_id": os.getenv("SPOTIPY_CLIENT_ID", ""),
            "spotify_client_secret": os.getenv("SPOTIPY_CLIENT_SECRET", ""),
            "superflac_cookie": os.getenv(
                "SUPERFLAC_COOKIE",
                "XSRF-TOKEN=eyJpdiI6IkxCYmVwYW10cHczSDkzZG5RMGdTT3c9PSIsInZhbHVlIjoiSTVWSit6TWI5MlR2S1hzak1JbklnZVBZbEh2Z205aGowVUVmOUZEV09ZaEZkYmxHMmNsWkFYL2M0LzhFRzV2T05wcllreEVPWm9CS3Y4TTBCWE5LMGVGY29reUpvY3BjaUt2U2tTUHN5OFFYZGM0eXRVd2VUY1BYaElwSVd2c0QiLCJtYWMiOiJlNWI2YTcwZDc4MTFlNDJjOTkxOTM2OTRiNGE1OGIyZmU4OTRhNjQ3ODkxYmM1MmIxMGQ1OTdlOGYwNGQxM2IyIiwidGFnIjoiIn0%3D; superflac-session=eyJpdiI6Imt5M1RRUy8rWFhGd0FBUHZCcWttOXc9PSIsInZhbHVlIjoiU3FiVHJOZjNzUDFjZGdBWkFqN1d1aFdzNUhEZ1Y3YmNUZmpyemVQVEM4SkJ0S01GZWo4THJNWFRHMndRNGdjdzB2OEdSVEc4Z2NUU2RYNjNZOExDeGZzdjMwNnZqSTVsVVBuQ0xrRlBwUElNeFkreDR1bHJRWFRTOFVsNExEV3giLCJtYWMiOiI4YTFhNGM3MzQ1ZTY4ZTc2ZGJkYTExZjE3ZTI5MWE0YTMyMTdlZTA1N2ZiOWVlNTAyM2I5Mjc5YjQ3ZjVlZWVkIiwidGFnIjoiIn0%3D"
            ),
            "superflac_token": os.getenv("SUPERFLAC_TOKEN", "H23AezPwrrB3Eh1rQzNwaL4o0hqBEvCpmnIosJFu"),
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

    def _inicializar_sesion_superflac(self, force_refresh=False):
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

        cookie_raw = self.config.get("superflac_cookie", "")
        if cookie_raw and not force_refresh:
            for item in cookie_raw.split(";"):
                if "=" in item:
                    k, v = item.strip().split("=", 1)
                    self.session.cookies.set(k, v, domain="superflac.com")
            self._csrf_token = self.config.get("superflac_token", self._csrf_token)

        if force_refresh:
            try:
                print("[SUPERFLAC] Refrescando sesión y token CSRF desde superflac.com...")
                r = self.session.get("https://superflac.com/", timeout=12)
                if r.status_code == 200:
                    m = re.search(r'name="_token"\s+value="([^"]+)"', r.text) or re.search(r'csrf-token"\s+content="([^"]+)"', r.text)
                    if m:
                        self._csrf_token = m.group(1)
                        print(f"[SUPERFLAC] Nuevo _token sincronizado: {self._csrf_token[:12]}...")
            except Exception as e:
                print(f"[SUPERFLAC WARN] No se pudo refrescar sesión automáticamente: {e}")

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

    def _resolver_apple_music_url(self, artist: str, title: str, music_url_actual: str = "") -> str:
        if music_url_actual and "music.apple.com" in music_url_actual:
            return music_url_actual.split("&uo=")[0]
        try:
            q = urllib.parse.quote(f"{artist} {title}")
            url = f"https://itunes.apple.com/search?term={q}&country=es&entity=song&limit=5"
            r = requests.get(url, timeout=8)
            if r.status_code == 200:
                results = r.json().get("results", [])
                if results:
                    track_view = results[0].get("trackViewUrl", "")
                    return track_view.split("&uo=")[0]
        except Exception as e:
            print(f"[SUPERFLAC WARN] Error resolviendo Apple Music URL: {e}")
        return ""

    def _solicitar_descarga_segura(self, music_url: str, quality: str = "FLAC_HIRES") -> tuple:
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

            # Recuperación proactiva contra 403, 409 y 429
            if status_code in (403, 419):
                print(f"[SUPERFLAC] Sesión expirada ({status_code}). Forzando refresco de tokens...")
                self._inicializar_sesion_superflac(force_refresh=True)
                time.sleep(1.0)
                res_obj, status_code, info_msg = self._solicitar_descarga_superflac(music_url, quality=quality)
                self._last_negotiation_time = time.time()
            elif status_code == 409:
                print("[SUPERFLAC WARN] HTTP 409 Conflicto en cola remota. Esperando 2.5s y refrescando...")
                self._inicializar_sesion_superflac(force_refresh=True)
                time.sleep(2.5)
                res_obj, status_code, info_msg = self._solicitar_descarga_superflac(music_url, quality=quality)
                self._last_negotiation_time = time.time()
            elif status_code == 429:
                print("[SUPERFLAC WARN] HTTP 429 Rate Limit. Aplicando backoff de 4.0s...")
                time.sleep(4.0 + random.uniform(0.5, 1.5))
                res_obj, status_code, info_msg = self._solicitar_descarga_superflac(music_url, quality=quality)
                self._last_negotiation_time = time.time()

            return res_obj, status_code, info_msg

    def _solicitar_descarga_superflac(self, music_url: str, quality: str = "FLAC_HIRES") -> tuple:
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
        if status != 200:
            return None, status, f"Error HTTP inesperado: {status}"

        ctype = r.headers.get("content-type", "").lower()
        if any(x in ctype for x in ["audio", "octet-stream", "flac"]):
            return r, 200, "STREAM_DIRECTO"

        body_text = r.text
        hx_redirect = r.headers.get("HX-Redirect") or r.headers.get("hx-redirect") or r.headers.get("Location")
        if hx_redirect:
            dl_url = hx_redirect if hx_redirect.startswith("http") else f"https://superflac.com{hx_redirect}"
            return dl_url, 200, "URL_EXTRAIDA"

        pat_urls = [
            r'href=["\'](https?://[^"\s>]+(?:download|flac|\.flac|\.m4a|\.mp3|\.wav)[^"\s>]*)["\']',
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
                hdrs = {} if is_cdn_file else {
                    "hx-request": "true",
                    "hx-current-url": "https://superflac.com/search?source=all&type=all&query=https%3A%2F%2Fsuperflac.com%2F",
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                }

                r_dl = self.session.get(url_actual, headers=hdrs, stream=True, timeout=(8, 16), allow_redirects=True)
                status = r_dl.status_code

                if status == 429:
                    r_dl.close()
                    print(f"[SUPERFLAC WARN] Rate limit (429). Esperando 3s...")
                    time.sleep(3.0)
                    continue

                if status in (403, 409):
                    r_dl.close()
                    return None, f"HTTP {status} en pasarela"

                ctype = r_dl.headers.get("content-type", "").lower()
                cdisp = r_dl.headers.get("content-disposition", "").lower()

                # Si es el CDN y realmente entrega audio o binario, éxito inmediato
                if is_cdn_file and status == 200 and not any(x in ctype for x in ["html", "json"]):
                    return r_dl, "OK"

                body = r_dl.text
                r_dl.close()

                # Si el CDN devolvió HTML (como los 6423 bytes de error/rate limit), no sigas reintentando la misma URL rota
                if is_cdn_file and "html" in ctype:
                    print(f"[SUPERFLAC WARN] El CDN devolvió HTML de error/bloqueo ({len(body)} bytes). Abortando nodo actual.")
                    return None, f"El servidor devolvió una página de bloqueo o límite al intentar descargar el fichero final."

                if body.startswith("fLaC"):
                    return self.session.get(url_actual, headers=hdrs, stream=True, timeout=30), "OK"

                print(f"[SUPERFLAC DEBUG] Intento {intento+1}/{max_polls} | Content-Type: {ctype} | Tamaño: {len(body)} bytes")

                patrones_enlace = [
                    r'href=["\'](https?://[^"\s>]+(?:file\?[^"\s>]+|\.flac|\.wav|\.mp3|\.m4a|download)[^"\s>]*)["\']',
                    r'data-url=["\'](https?://[^"\s>]+)["\']',
                    r'window\.location\.href\s*=\s*["\']([^"\']+)["\']',
                    r'action=["\'](/downloads/[^"\']+)["\']'
                ]
                
                enlace_encontrado = None
                for pat in patrones_enlace:
                    m = re.search(pat, body, re.IGNORECASE)
                    if m:
                        cand = m.group(1).replace("&amp;", "&")
                        cand_full = cand if cand.startswith("http") else f"https://superflac.com{cand}"
                        if cand_full != url_actual and "search" not in cand_full:
                            enlace_encontrado = cand_full
                            break

                if enlace_encontrado:
                    print(f"[SUPERFLAC] Siguiente nodo detectado: {enlace_encontrado}")
                    url_actual = enlace_encontrado
                    time.sleep(1.0)
                    continue

                poll_delay = min(2.5, 1.0 + (intento * 0.3))
                time.sleep(poll_delay)

            except (requests.exceptions.Timeout, requests.exceptions.ReadTimeout, requests.exceptions.ConnectTimeout) as t_err:
                timeouts_count += 1
                print(f"[SUPERFLAC POLL WARN] Timeout al conectar ({t_err}). Reintento {timeouts_count}/2...")
                if timeouts_count >= 2:
                    return None, "Tiempo de espera agotado al conectar con el servidor SuperFLAC."
                time.sleep(1.5)
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
            "flac": ("FLAC_HIRES", "flac"),
            "wav": ("FLAC_HIRES", "wav"),
            "aiff": ("FLAC_HIRES", "aiff"),
            "mp3": ("MP3_320", "mp3")
        }
        sf_quality, ext_final = quality_map.get(fmt, ("FLAC_HIRES", "flac"))

        ruta_temp_flac = os.path.join(dest_folder, f"{safe_artist} - {safe_title}.flac")
        ruta_final = os.path.join(dest_folder, f"{safe_artist} - {safe_title}.{ext_final}")

        music_url = self._resolver_apple_music_url(
            safe_artist,
            safe_title,
            meta_track.get("apple_url", "")
        )
        if not music_url:
            return {"status": "error", "msg": "No se pudo resolver el music_url de Apple Music para SuperFLAC", "path": ""}

        print(f"[SUPERFLAC] Solicitando {sf_quality} para URL: {music_url}")

        res_obj, status_code, info_msg = self._solicitar_descarga_segura(music_url, quality=sf_quality)
        if not res_obj:
            return {"status": "error", "msg": info_msg, "path": ""}

        try:
            if info_msg == "URL_EXTRAIDA" and isinstance(res_obj, str):
                print(f"[SUPERFLAC] Resolviendo stream binario desde: {res_obj}...")
                r_stream, err_stream = self._resolver_stream_final(res_obj)
                if not r_stream:
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
                        return {
                            "status": "error",
                            "msg": f"Cabecera inválida (no es audio reconocido): {header_snippet[:60]}",
                            "path": ""
                        }

            if not os.path.exists(ruta_temp_flac) or os.path.getsize(ruta_temp_flac) < 2048:
                if os.path.exists(ruta_temp_flac):
                    os.remove(ruta_temp_flac)
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
