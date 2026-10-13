import os
import urllib.parse
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from typing import List, Dict, Any, Optional, Callable

class SpotifyDownloaderAdapter:
    """Adaptador de alto rendimiento para interactuar con la Web API de Spotify."""

    @classmethod
    def _cargar_credenciales_env(cls) -> tuple[Optional[str], Optional[str]]:
        cid = os.getenv("SPOTIPY_CLIENT_ID") or os.getenv("SPOTIFY_CLIENT_ID")
        csec = os.getenv("SPOTIPY_CLIENT_SECRET") or os.getenv("SPOTIFY_CLIENT_SECRET")
        
        if cid and csec:
            return cid, csec

        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip().strip("\"'")
                    if k in ("SPOTIPY_CLIENT_ID", "SPOTIFY_CLIENT_ID") and not cid:
                        cid = v
                    elif k in ("SPOTIPY_CLIENT_SECRET", "SPOTIFY_CLIENT_SECRET") and not csec:
                        csec = v

        return cid, csec

    @classmethod
    def _get_client(cls) -> spotipy.Spotify:
        client_id, client_secret = cls._cargar_credenciales_env()
        if not client_id or not client_secret:
            raise ValueError("Credenciales de Spotify no localizadas en entorno ni en archivo .env")

        auth_manager = SpotifyClientCredentials(client_id=client_id, client_secret=client_secret)
        return spotipy.Spotify(auth_manager=auth_manager)

    @classmethod
    def _extraer_id_y_tipo(cls, url_or_uri: str) -> tuple[Optional[str], Optional[str]]:
        if not url_or_uri:
            return None, None
            
        if url_or_uri.startswith("spotify:"):
            partes = url_or_uri.split(":")
            if len(partes) >= 3:
                return partes[1].lower(), partes[2].split("?")[0]

        parsed = urllib.parse.urlparse(url_or_uri)
        partes = [p for p in parsed.path.split("/") if p]
        
        tipos_validos = {"artist", "playlist", "album", "track"}
        for i, parte in enumerate(partes):
            if parte.lower() in tipos_validos and i + 1 < len(partes):
                tipo = parte.lower()
                spotify_id = partes[i + 1].split("?")[0]
                return tipo, spotify_id

        return None, None

    @classmethod
    def _ms_a_min_seg(cls, dur_ms: int) -> str:
        if not dur_ms:
            return "00:00"
        seg = int(dur_ms / 1000)
        return f"{seg // 60:02d}:{seg % 60:02d}"

    @classmethod
    def escanear_lista(cls, url: str, callback_log: Optional[Callable[[str, str], None]] = None) -> List[Dict[str, Any]]:
        tipo, spotify_id = cls._extraer_id_y_tipo(url)
        if not tipo or not spotify_id:
            if callback_log:
                callback_log(f"Formato de URL no válido: {url}", "error")
            return []

        try:
            sp = cls._get_client()
        except Exception as e:
            if callback_log:
                callback_log(f"Error de credenciales Spotify: {e}", "error")
            return []

        resultados: List[Dict[str, Any]] = []

        if callback_log:
            callback_log(f"Recurso Spotify detectado [{tipo.upper()}]: {spotify_id}", "info")

        try:
            if tipo == "artist":
                # Spotify en modo desarrollo exige limit <= 5 o 10
                items_albums = []
                for offset in range(0, 40, 5):
                    try:
                        data = sp.artist_albums(spotify_id, limit=5, offset=offset)
                        bloque = data.get("items", [])
                        items_albums.extend(bloque)
                        if len(bloque) < 5:
                            break
                    except Exception:
                        break

                nombres_vistos = set()
                for alb in items_albums:
                    alb_nom = alb.get("name")
                    if alb_nom in nombres_vistos:
                        continue
                    nombres_vistos.add(alb_nom)

                    cover = alb["images"][0]["url"] if alb.get("images") else ""
                    year = (alb.get("release_date") or "2024")[:4]

                    try:
                        tracks_page = sp.album_tracks(alb["id"], limit=50)
                        for t in tracks_page.get("items", []):
                            art = t["artists"][0]["name"] if t.get("artists") else "Desconocido"
                            dur_ms = t.get("duration_ms", 0)
                            resultados.append({
                                "artista": art,
                                "titulo": t.get("name", "Sin título"),
                                "album": alb_nom,
                                "year": year,
                                "cover_url": cover,
                                "preview_url": t.get("preview_url") or "",
                                "duracion_ms": dur_ms,
                                "duracion": cls._ms_a_min_seg(dur_ms)
                            })
                    except Exception:
                        continue

            elif tipo == "playlist":
                res = sp.playlist_items(spotify_id, limit=50)
                for item in res.get("items", []):
                    t = item.get("track")
                    if not t or not t.get("id"):
                        continue
                    art = t["artists"][0]["name"] if t.get("artists") else "Desconocido"
                    alb = t.get("album", {})
                    cover = alb["images"][0]["url"] if alb.get("images") else ""
                    dur_ms = t.get("duration_ms", 0)
                    resultados.append({
                        "artista": art,
                        "titulo": t.get("name", "Sin título"),
                        "album": alb.get("name", "Playlist Track"),
                        "year": (alb.get("release_date") or "2024")[:4],
                        "cover_url": cover,
                        "preview_url": t.get("preview_url") or "",
                        "duracion_ms": dur_ms,
                        "duracion": cls._ms_a_min_seg(dur_ms)
                    })

            elif tipo == "track":
                t = sp.track(spotify_id)
                art = t["artists"][0]["name"] if t.get("artists") else "Desconocido"
                alb = t.get("album", {})
                cover = alb["images"][0]["url"] if alb.get("images") else ""
                dur_ms = t.get("duration_ms", 0)
                resultados.append({
                    "artista": art,
                    "titulo": t.get("name", "Sin título"),
                    "album": alb.get("name", "Single"),
                    "year": (alb.get("release_date") or "2024")[:4],
                    "cover_url": cover,
                    "preview_url": t.get("preview_url") or "",
                    "duracion_ms": dur_ms,
                    "duracion": cls._ms_a_min_seg(dur_ms)
                })

        except Exception as e:
            if callback_log:
                callback_log(f"Fallo al consultar Spotify API: {str(e)}", "error")
            return []

        if callback_log:
            callback_log(f"Extracción finalizada: {len(resultados)} pistas procesadas.", "success")
        return resultados
