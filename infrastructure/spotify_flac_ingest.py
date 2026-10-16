import os
import re
import time
import json
import hashlib
import requests
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from infrastructure.audio_processor import AudioProcessorService

CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config_ingest.json")


class SpotifyFlacIngestService:
    """
    Motor nativo en Python puro para:
    1. Extracción de metadatos oficiales, ISRC, BPM y Key Camelot desde Spotify API.
    2. Resolución de streams FLAC sin pérdidas (16/24-bit) mediante ISRC Cross-Platform Matching.
    3. Descarga por chunks y etiquetado Vorbis Comments + Cover Art HD.
    """

    def __init__(self):
        self.config = self._cargar_config()
        self.sp = self._inicializar_spotipy()

    def _cargar_config(self) -> dict:
        default_cfg = {
            "spotify_client_id": os.getenv("SPOTIPY_CLIENT_ID", ""),
            "spotify_client_secret": os.getenv("SPOTIPY_CLIENT_SECRET", ""),
            "qobuz_app_id": os.getenv("QOBUZ_APP_ID", "950096963"),
            "qobuz_app_secret": os.getenv("QOBUZ_APP_SECRET", ""),
            "qobuz_user_auth_token": os.getenv("QOBUZ_AUTH_TOKEN", ""),
            "custom_flac_gateway_url": os.getenv("FLAC_GATEWAY_URL", ""),
            "download_dir": os.path.expanduser("~/Music/CleanDJmix_FLAC")
        }
        if os.path.exists(CONFIG_PATH):
            try:
                with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                    saved = json.load(f)
                    default_cfg.update({k: v for k, v in saved.items() if v})
            except Exception:
                pass
        return default_cfg

    def guardar_config(self, nueva_config: dict) -> dict:
        self.config.update(nueva_config)
        try:
            with open(CONFIG_PATH, "w", encoding="utf-8") as f:
                json.dump(self.config, f, indent=4)
        except Exception as e:
            return {"status": "error", "msg": str(e)}
        self.sp = self._inicializar_spotipy()
        return {"status": "ok", "msg": "Configuración guardada correctamente"}

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

    def extraer_metadatos_spotify_url(self, spotify_url: str) -> list:
        """
        Acepta una URL de Track, Album o Playlist de Spotify y devuelve la lista
        completa de pistas con ISRC, BPM, Key Camelot, Energía y Carátula HD.
        """
        if not self.sp:
            return []

        items_brutos = []
        try:
            if "track/" in spotify_url or ":track:" in spotify_url:
                t = self.sp.track(spotify_url)
                items_brutos = [t]
            elif "playlist/" in spotify_url or ":playlist:" in spotify_url:
                results = self.sp.playlist_items(spotify_url, additional_types=("track",))
                while results:
                    for item in results.get("items", []):
                        if item and item.get("track"):
                            items_brutos.append(item["track"])
                    results = self.sp.next(results) if results.get("next") else None
            elif "album/" in spotify_url or ":album:" in spotify_url:
                album_info = self.sp.album(spotify_url)
                for t_simple in album_info.get("tracks", {}).get("items", []):
                    full_t = self.sp.track(t_simple["id"])
                    items_brutos.append(full_t)
        except Exception as e:
            print(f"[SpotifyFlacIngest] Error consultando URL de Spotify: {e}")
            return []

        # Obtener Audio Features en lotes de 100 para extraer BPM y Key Camelot
        track_ids = [t["id"] for t in items_brutos if t and t.get("id")]
        features_map = {}
        for i in range(0, len(track_ids), 100):
            lote = track_ids[i:i + 100]
            try:
                feats = self.sp.audio_features(lote)
                if feats:
                    for f in feats:
                        if f and f.get("id"):
                            features_map[f["id"]] = f
            except Exception:
                pass

        tracks_procesados = []
        for t in items_brutos:
            if not t or not t.get("id"):
                continue
            tid = t["id"]
            feat = features_map.get(tid, {})
            bpm = round(float(feat.get("tempo", 124.0)), 2) if feat else 124.0
            pitch = feat.get("key", 0) if feat else 0
            mode = feat.get("mode", 0) if feat else 0
            camelot_key = AudioProcessorService.spotify_key_to_camelot(pitch, mode)
            energy = int(float(feat.get("energy", 0.8)) * 100) if feat else 80

            album_obj = t.get("album", {})
            images = album_obj.get("images", [])
            cover_url = images[0]["url"] if images else ""
            artists = ", ".join([a["name"] for a in t.get("artists", [])])
            isrc = t.get("external_ids", {}).get("isrc", "")
            duration_ms = t.get("duration_ms", 0)
            mins = (duration_ms // 1000) // 60
            secs = (duration_ms // 1000) % 60

            tracks_procesados.append({
                "spotify_id": tid,
                "title": t.get("name", "Unknown"),
                "artist": artists,
                "album": album_obj.get("name", ""),
                "isrc": isrc,
                "bpm": bpm,
                "key": camelot_key,
                "energy": energy,
                "duration": f"{mins}:{secs:02d}",
                "cover_url": cover_url,
                "format": "FLAC (Pending)",
                "status": "Ready for Ingest"
            })

        return tracks_procesados

    def enriquecer_track_local_con_spotify(self, ruta_archivo: str) -> dict:
        """
        Busca una pista local en Spotify por ISRC o por Artista + Título,
        obtiene BPM, Key Camelot, Álbum, ISRC y Portada HD y los inyecta en el archivo local (FLAC o MP3).
        """
        info_local = AudioProcessorService.analizar_track_avanzado(ruta_archivo)
        if not self.sp:
            return {"status": "error", "msg": "Configura tus credenciales de Spotify API primero", "track": info_local}

        query = f"isrc:{info_local['isrc']}" if info_local.get("isrc") else f"artist:{info_local['artist']} track:{info_local['title']}"
        try:
            res = self.sp.search(q=query, type="track", limit=1)
            items = res.get("tracks", {}).get("items", [])
            if not items and info_local.get("isrc"):
                # Segundo intento por nombre limpio si el ISRC no devolvió coincidencia
                query_fallback = f"{info_local['artist']} {info_local['title']}"
                res = self.sp.search(q=query_fallback, type="track", limit=1)
                items = res.get("tracks", {}).get("items", [])

            if not items:
                return {"status": "not_found", "msg": "No se encontró coincidencia en Spotify", "track": info_local}

            t = items[0]
            tid = t["id"]
            feat_list = self.sp.audio_features([tid])
            feat = feat_list[0] if feat_list and feat_list[0] else {}

            bpm = round(float(feat.get("tempo", info_local["bpm"])), 2)
            camelot_key = AudioProcessorService.spotify_key_to_camelot(feat.get("key", 0), feat.get("mode", 0)) if feat else info_local["key"]
            album_obj = t.get("album", {})
            images = album_obj.get("images", [])
            cover_url = images[0]["url"] if images else None

            nuevos_meta = {
                "title": t.get("name", info_local["title"]),
                "artist": ", ".join([a["name"] for a in t.get("artists", [])]),
                "album": album_obj.get("name", info_local.get("album", "")),
                "isrc": t.get("external_ids", {}).get("isrc", info_local.get("isrc", "")),
                "bpm": bpm,
                "key": camelot_key
            }

            exito = AudioProcessorService.escribir_metadatos_pro(ruta_archivo, nuevos_meta, cover_url=cover_url)
            track_actualizado = AudioProcessorService.analizar_track_avanzado(ruta_archivo)
            return {
                "status": "ok" if exito else "error",
                "msg": "Metadatos inyectados correctamente",
                "track": track_actualizado
            }
        except Exception as e:
            return {"status": "error", "msg": str(e), "track": info_local}

    def _resolver_stream_qobuz_por_isrc(self, isrc: str, query_fallback: str) -> str:
        """
        Resuelve la URL directa del stream FLAC Lossless (format_id=6 / 16-bit 44.1kHz o 27 / 24-bit)
        en Qobuz mediante Python puro (arquitectura qobuz-dl).
        """
        app_id = self.config.get("qobuz_app_id", "").strip()
        app_secret = self.config.get("qobuz_app_secret", "").strip()
        user_token = self.config.get("qobuz_user_auth_token", "").strip()

        if not (app_id and app_secret and user_token):
            return ""

        headers = {
            "X-App-Id": app_id,
            "X-User-Auth-Token": user_token,
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        }

        try:
            q = isrc if isrc else query_fallback
            r_search = requests.get(
                "https://www.qobuz.com/api.json/0.2/track/search",
                params={"query": q, "limit": 5},
                headers=headers,
                timeout=12
            )
            if r_search.status_code != 200:
                return ""

            tracks = r_search.json().get("tracks", {}).get("items", [])
            if not tracks:
                return ""

            qobuz_track_id = str(tracks[0]["id"])
            format_id = "6"  # 6 = FLAC Lossless 16-bit / 44.1kHz
            unix_ts = str(time.time())

            # Firma criptográfica MD5 requerida por el endpoint getFileUrl de Qobuz
            raw_sig = f"trackgetFileUrlformat_id{format_id}intentstreamtrack_id{qobuz_track_id}{unix_ts}{app_secret}"
            request_sig = hashlib.md5(raw_sig.encode("utf-8")).hexdigest()

            r_url = requests.get(
                "https://www.qobuz.com/api.json/0.2/track/getFileUrl",
                params={
                    "request_ts": unix_ts,
                    "request_sig": request_sig,
                    "track_id": qobuz_track_id,
                    "format_id": format_id,
                    "intent": "stream"
                },
                headers=headers,
                timeout=12
            )
            if r_url.status_code == 200:
                return r_url.json().get("url", "")
        except Exception as e:
            print(f"[SpotifyFlacIngest] Error en resolver Qobuz FLAC: {e}")

        return ""

    def descargar_e_inyectar_flac(self, meta_track: dict, directorio_destino: str = None, progress_cb=None) -> dict:
        """
        Orquesta la descarga del archivo .flac real por chunks de 64KB,
        verifica la cabecera 'fLaC' para garantizar que NO es un archivo con pérdida renombrado,
        e inyecta los Vorbis Comments (BPM, Key Camelot, ISRC) + Carátula HD.
        """
        dest_folder = directorio_destino or self.config.get("download_dir", os.path.expanduser("~/Music/CleanDJmix_FLAC"))
        os.makedirs(dest_folder, exist_ok=True)

        safe_artist = re.sub(r'[\\/*?:"<>|]', "", meta_track.get("artist", "Artist")).strip()
        safe_title = re.sub(r'[\\/*?:"<>|]', "", meta_track.get("title", "Track")).strip()
        ruta_flac = os.path.join(dest_folder, f"{safe_artist} - {safe_title}.flac")

        isrc = meta_track.get("isrc", "")
        stream_url = self._resolver_stream_qobuz_por_isrc(isrc, f"{safe_artist} {safe_title}")

        # Soporte para pasarela FLAC personalizada si el usuario configura un endpoint propio
        if not stream_url and self.config.get("custom_flac_gateway_url"):
            gw = self.config["custom_flac_gateway_url"].rstrip("/")
            try:
                r_gw = requests.get(f"{gw}/resolve", params={"isrc": isrc, "q": f"{safe_artist} - {safe_title}"}, timeout=15)
                if r_gw.status_code == 200:
                    stream_url = r_gw.json().get("flac_url", "")
            except Exception:
                pass

        if not stream_url:
            return {
                "status": "error",
                "msg": "Stream FLAC no disponible (Verifica tus tokens Lossless en Configuración)",
                "path": ""
            }

        try:
            with requests.get(stream_url, stream=True, timeout=30) as r:
                r.raise_for_status()
                total = int(r.headers.get("content-length", 0))
                descargado = 0
                primer_chunk_verificado = False

                with open(ruta_flac, "wb") as f:
                    for chunk in r.iter_content(chunk_size=65536):
                        if not chunk:
                            continue
                        if not primer_chunk_verificado:
                            # Verificación estricta de Magic Bytes 'fLaC' (0x66 0x4C 0x61 0x43)
                            if not chunk.startswith(b"fLaC"):
                                raise ValueError("El stream recibido no posee cabecera fLaC Lossless auténtica.")
                            primer_chunk_verificado = True

                        f.write(chunk)
                        descargado += len(chunk)
                        if progress_cb and total > 0:
                            progress_cb(int((descargado / total) * 100))

            # Escribir Vorbis Comments y portada oficial
            AudioProcessorService.escribir_metadatos_pro(
                ruta_flac,
                meta_track,
                cover_url=meta_track.get("cover_url")
            )

            track_auditado = AudioProcessorService.analizar_track_avanzado(ruta_flac)
            return {
                "status": "ok",
                "msg": "FLAC Lossless descargado y etiquetado con éxito",
                "path": ruta_flac,
                "track": track_auditado
            }
        except Exception as e:
            if os.path.exists(ruta_flac):
                os.remove(ruta_flac)
            return {"status": "error", "msg": str(e), "path": ""}
