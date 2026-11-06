import asyncio
import requests
from shazamio import Shazam

class ShazamAdapter:
    """Identificación acústica en la nube y consulta a bases de datos musicales."""

    @staticmethod
    def buscar_discogs(artista: str, titulo: str) -> tuple:
        try:
            url = f"https://itunes.apple.com/search?term={artista}+{titulo}&entity=song&limit=1"
            r = requests.get(url, timeout=4).json()
            if r.get("resultCount", 0) > 0:
                item = r["results"][0]
                release = item.get("releaseDate", "")
                year = int(release.split("-")[0]) if release else 0
                return item.get("artistName", artista), item.get("trackName", titulo), year
        except Exception:
            pass
        return artista, titulo, 0

    @staticmethod
    def rescate_shazam(ruta_completa: str) -> tuple:
        async def _reconocer():
            shazam = Shazam()
            return await shazam.recognize(ruta_completa)

        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            out = loop.run_until_complete(_reconocer())
            loop.close()
            track = out.get("track", {})
            if track:
                return track.get("subtitle", "Desconocido"), track.get("title", "Desconocido")
        except Exception:
            pass
        return "Desconocido", "Desconocido"
