import os
import requests
import urllib.parse
from typing import Optional, Dict, Any

class AudioStreamService:
    """Engine de obtención de audio ultra-rápido (<500ms) para Preescucha DJ."""

    def __init__(self, temp_dir: Optional[str] = None):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.temp_dir = temp_dir or os.path.join(base_dir, "cache_preview")
        os.makedirs(self.temp_dir, exist_ok=True)

    def _limpiar_slug(self, texto: str) -> str:
        return "".join(c for c in texto if c.isalnum() or c in "_-").strip() or "preview"

    def _descargar_mp3(self, url: str, destino: str, timeout: int = 4) -> bool:
        try:
            r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=timeout)
            if r.status_code == 200 and len(r.content) > 5000:
                with open(destino, "wb") as f:
                    f.write(r.content)
                return True
        except Exception:
            pass
        return False

    def obtener_audio_track(self, item: Dict[str, Any]) -> Optional[str]:
        artista = item.get("artista", "Unknown")
        titulo = item.get("titulo", "Track")
        slug = self._limpiar_slug(f"{artista}_{titulo}")
        preview_url = item.get("preview_url")

        # 1. Comprobación en caché local
        for ext in [".mp3", ".m4a", ".aac"]:
            f = os.path.join(self.temp_dir, f"{slug}{ext}")
            if os.path.exists(f) and os.path.getsize(f) > 5000:
                return f

        dest_mp3 = os.path.join(self.temp_dir, f"{slug}.mp3")

        # 2. Spotify CDN (si el metadata trae URL directa de 30s)
        if preview_url and str(preview_url).startswith("http"):
            if self._descargar_mp3(preview_url, dest_mp3, timeout=3):
                return dest_mp3

        # 3. Tier 1A: iTunes / Apple CDN (0.2s - 0.4s)
        try:
            q_itunes = urllib.parse.quote(f"{artista} {titulo}")
            url_it = f"https://itunes.apple.com/search?term={q_itunes}&media=music&entity=song&limit=1"
            r_it = requests.get(url_it, timeout=2.5).json()
            if r_it.get("resultCount", 0) > 0:
                it_preview = r_it["results"][0].get("previewUrl")
                if it_preview and self._descargar_mp3(it_preview, dest_mp3, timeout=3):
                    return dest_mp3
        except Exception:
            pass

        # 4. Tier 1B: Deezer API CDN (0.2s - 0.4s)
        try:
            q_deezer = urllib.parse.quote(f'artist:"{artista}" track:"{titulo}"')
            url_dz = f"https://api.deezer.com/search?q={q_deezer}&limit=1"
            r_dz = requests.get(url_dz, timeout=2.5).json()
            items_dz = r_dz.get("data", [])
            if items_dz and items_dz[0].get("preview"):
                dz_preview = items_dz[0]["preview"]
                if self._descargar_mp3(dz_preview, dest_mp3, timeout=3):
                    return dest_mp3
        except Exception:
            pass

        # 5. Tier 2: yt-dlp (Fallback de último recurso para releases underground)
        try:
            import yt_dlp
            out_template = os.path.join(self.temp_dir, f"{slug}.%(ext)s")
            ydl_opts = {
                "format": "ba[ext=m4a]/ba/best",
                "outtmpl": out_template,
                "quiet": True,
                "no_warnings": True,
                "cachedir": False,
                "socket_timeout": 6,
                "download_ranges": yt_dlp.utils.download_range_func(None, [(0, 45)]),
                "ffmpeg_location": "/usr/local/bin/ffmpeg",
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([f"ytsearch1:{artista} - {titulo} audio"])
            
            for ext in [".m4a", ".mp3", ".webm"]:
                candidato = os.path.join(self.temp_dir, f"{slug}{ext}")
                if os.path.exists(candidato) and os.path.getsize(candidato) > 5000:
                    return candidato
        except Exception:
            pass

        return None
