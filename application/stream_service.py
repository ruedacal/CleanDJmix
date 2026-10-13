import os
import tempfile
import requests
import yt_dlp
from typing import Optional, Dict, Any

class AudioStreamService:
    """Gestiona la obtención y almacenamiento en caché de audios para preescucha."""

    def __init__(self, temp_dir: Optional[str] = None):
        self.temp_dir = temp_dir or tempfile.gettempdir()

    def _limpiar_nombre(self, texto: str) -> str:
        return "".join(c for c in texto if c.isalnum() or c in "_-").strip()

    def obtener_audio_track(self, item: Dict[str, Any]) -> Optional[str]:
        artista = item.get("artista", "")
        titulo = item.get("titulo", "")
        clean_tag = self._limpiar_nombre(f"{artista}_{titulo}")
        preview_url = item.get("preview_url")

        # 1. Intentar MP3 directo de Spotify (alta velocidad, bajo peso)
        if preview_url:
            sp_dest = os.path.join(self.temp_dir, f"sp_{clean_tag}.mp3")
            if os.path.exists(sp_dest) and os.path.getsize(sp_dest) > 5000:
                return sp_dest
            try:
                r = requests.get(preview_url, timeout=5)
                if r.status_code == 200 and len(r.content) > 5000:
                    with open(sp_dest, "wb") as f:
                        f.write(r.content)
                    return sp_dest
            except Exception:
                pass

        # 2. Respaldo: Audio stream vía yt-dlp compatible con macOS afplay
        yt_dest = os.path.join(self.temp_dir, f"cdj_{clean_tag}.m4a")
        if os.path.exists(yt_dest) and os.path.getsize(yt_dest) > 10000:
            return yt_dest

        query = f"{artista} - {titulo} audio"
        opts = {
            "format": "ba/b",
            "outtmpl": yt_dest,
            "quiet": True,
            "no_warnings": True,
            "extractor_args": {"youtube": {"player_client": ["android", "web"]}},
        }
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([f"ytsearch1:{query}"])
            if os.path.exists(yt_dest) and os.path.getsize(yt_dest) > 5000:
                return yt_dest
        except Exception as e:
            print(f"[StreamService Error] {e}")

        return None
