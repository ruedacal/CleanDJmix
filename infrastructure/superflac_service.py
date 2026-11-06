import re
import urllib.parse
import requests

class SuperFlacService:
    """
    Resolución de pistas y artistas combinando Spotify oEmbed y MusicBrainz.
    Soporta URLs de tracks individuales y listados de temas al pasar enlaces de artista.
    """
    USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    MB_HEADERS = {"User-Agent": "CleanDJmixPRO/2.0 ( contact@cleandjmix.internal )"}

    @staticmethod
    def limpiar_enlace(url: str) -> str:
        parsed = urllib.parse.urlparse(url.strip())
        return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"

    @classmethod
    def resolver_metadata(cls, query_o_url: str) -> list:
        url_limpia = cls.limpiar_enlace(query_o_url)
        headers = {"User-Agent": cls.USER_AGENT}

        # 1. Resolver con oEmbed de Spotify
        oembed_url = f"https://open.spotify.com/oembed?url={urllib.parse.quote(url_limpia)}"
        try:
            r = requests.get(oembed_url, headers=headers, timeout=8)
            if r.status_code != 200:
                return [{"error": f"No se pudo resolver el enlace (Estado HTTP {r.status_code})."}]
            data = r.json()
        except Exception as e:
            return [{"error": f"Error de conexión: {str(e)}"}]

        es_artista = "/artist/" in url_limpia
        nombre_entidad = data.get("title", "").strip()
        cover_url = data.get("thumbnail_url", "")

        # --- CASO ARTISTA: Obtener listado de canciones desde MusicBrainz ---
        if es_artista:
            nombre_artista = nombre_entidad.split(" | Spotify")[0].strip()
            tracks_artista = cls._obtener_tracks_artista_musicbrainz(nombre_artista, cover_url)
            if tracks_artista:
                return tracks_artista
            return [{
                "id": "trk_artist_placeholder",
                "url": url_limpia,
                "titulo": f"Catálogo de {nombre_artista}",
                "artista": nombre_artista,
                "album": "Discografía",
                "duracion": "--:--",
                "isrc": "N/A",
                "cover_url": cover_url,
                "audio_preview": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
            }]

        # --- CASO TRACK INDIVIDUAL ---
        artista = "Desconocido"
        titulo = nombre_entidad

        if " - " in nombre_entidad:
            partes = nombre_entidad.split(" - ", 1)
            artista = partes[0].strip()
            titulo = partes[1].strip()
        elif " by " in nombre_entidad:
            partes = nombre_entidad.split(" by ", 1)
            titulo = partes[0].strip()
            artista = partes[1].strip()

        isrc = cls._buscar_isrc_musicbrainz(titulo, artista)
        track_id = "trk_" + str(abs(hash(url_limpia)))[:8]

        return [{
            "id": track_id,
            "url": url_limpia,
            "titulo": titulo,
            "artista": artista,
            "album": "Catálogo",
            "duracion": "--:--",
            "isrc": isrc if isrc else "No indexado en MusicBrainz",
            "cover_url": cover_url,
            "audio_preview": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        }]

    @classmethod
    def _obtener_tracks_artista_musicbrainz(cls, artista: str, cover_url: str) -> list:
        """Obtiene un listado de grabaciones del artista desde MusicBrainz."""
        try:
            artista_q = re.sub(r'[\(\)\[\]\{\}\^\~\*\?\:\\]', '', artista).strip()
            url_busqueda = "https://musicbrainz.org/ws/2/recording/"
            params = {
                "query": f'artist:"{artista_q}"',
                "fmt": "json",
                "limit": 10
            }
            res = requests.get(url_busqueda, headers=cls.MB_HEADERS, params=params, timeout=5)
            if res.status_code == 200:
                recordings = res.json().get("recordings", [])
                lista = []
                for idx, r in enumerate(recordings):
                    titulo = r.get("title", f"Track {idx+1}")
                    length_ms = r.get("length")
                    duracion = f"{length_ms // 60000}:{(length_ms % 60000) // 1000:02d}" if length_ms else "--:--"
                    rec_id = r.get("id")
                    
                    # Extraer ISRC si está en la lista de isrcs del recording
                    isrcs = r.get("isrcs", [])
                    isrc = isrcs[0] if isrcs else "ISRC pendiente"

                    lista.append({
                        "id": f"mb_{rec_id[:8]}" if rec_id else f"trk_{idx+1}",
                        "url": f"https://musicbrainz.org/recording/{rec_id}",
                        "titulo": titulo,
                        "artista": artista,
                        "album": "Catálogo Studio",
                        "duracion": duracion,
                        "isrc": isrc,
                        "cover_url": cover_url,
                        "audio_preview": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                    })
                return lista
        except Exception:
            pass
        return []

    @classmethod
    def _buscar_isrc_musicbrainz(cls, titulo: str, artista: str) -> str:
        try:
            titulo_q = re.sub(r'[\(\)\[\]\{\}\^\~\*\?\:\\]', '', titulo).strip()
            artista_q = re.sub(r'[\(\)\[\]\{\}\^\~\*\?\:\\]', '', artista).strip()
            query = f'recording:"{titulo_q}"'
            if artista_q and artista_q != "Desconocido":
                query += f' AND artist:"{artista_q}"'
            
            url_busqueda = "https://musicbrainz.org/ws/2/recording/"
            params = {"query": query, "fmt": "json", "limit": 1}
            res = requests.get(url_busqueda, headers=cls.MB_HEADERS, params=params, timeout=4)
            if res.status_code == 200:
                recordings = res.json().get("recordings", [])
                if recordings:
                    rec_id = recordings[0].get("id")
                    res_det = requests.get(f"https://musicbrainz.org/ws/2/recording/{rec_id}?inc=isrcs&fmt=json", headers=cls.MB_HEADERS, timeout=4)
                    if res_det.status_code == 200:
                        isrcs = res_det.json().get("isrcs", [])
                        if isrcs:
                            return isrcs[0]
        except Exception:
            pass
        return ""

    @classmethod
    def descargar_pista(cls, pista_info: dict, formato_deseado: str, ruta_destino: str = "", callback_log=None):
        return {"status": "ok", "tipo": "metadata_only", "aviso_calidad": False}
