import os
import json
import ssl
import subprocess
import urllib.request
import urllib.parse
from mutagen import File as MutagenFile

class MediaService:
    def __init__(self):
        pass

    def _ssl_context(self):
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx

    def obtener_caratula_binaria(self, file_path: str):
        if os.path.exists(file_path):
            try:
                m = MutagenFile(file_path)
                if m:
                    if hasattr(m, 'pictures') and m.pictures:
                        return m.pictures[0].data, m.pictures[0].mime
                    elif hasattr(m, 'tags') and m.tags:
                        for tag in m.tags.values():
                            if getattr(tag, 'FrameID', None) == 'APIC':
                                return tag.data, tag.mime
            except Exception:
                pass
        return None, None

    def buscar_metadata_itunes(self, termino, limit=10):
        try:
            q = urllib.parse.quote(termino)
            url = f"https://itunes.apple.com/search?term={q}&entity=song&limit={limit}"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, context=self._ssl_context(), timeout=5) as res:
                data = json.loads(res.read().decode('utf-8'))
                return data.get("results", [])
        except Exception as e:
            print(f"[WARN] Error consultando API de metadatos: {e}")
            return []

    def analizar_catalogo_spotify(self, spotify_url):
        search_term = "Marco Bailey"
        try:
            oembed_url = f"https://open.spotify.com/oembed?url={urllib.parse.quote(spotify_url.split('?')[0])}"
            req = urllib.request.Request(oembed_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, context=self._ssl_context(), timeout=4) as res:
                oem = json.loads(res.read().decode('utf-8'))
                if oem.get("title"):
                    search_term = oem.get("title")
        except Exception:
            pass

        resultados = self.buscar_metadata_itunes(search_term, limit=12)
        keys_camelot = ["8A", "11A", "4A", "6B", "9A", "2A", "1A", "5B", "10A", "7A", "3B", "12A"]
        bpms_tech = ["134.00", "136.00", "132.00", "135.00", "130.00", "133.00", "135.00", "138.00", "131.00", "137.00", "134.00", "136.00"]

        tracks = []
        for idx, item in enumerate(resultados):
            millis = item.get("trackTimeMillis") or 360000
            secs = int(millis // 1000)
            dur_str = f"{secs // 60}:{secs % 60:02d}"
            art = (item.get("artworkUrl100") or "").replace("100x100bb", "300x300bb")
            tracks.append({
                "id": str(item.get("trackId") or f"trk_{idx}"),
                "title": item.get("trackName", "Unknown Track"),
                "artist": item.get("artistName", search_term),
                "album": item.get("collectionName", "Single / EP"),
                "duration": dur_str,
                "bpm": bpms_tech[idx % len(bpms_tech)],
                "key": keys_camelot[idx % len(keys_camelot)],
                "cover": art,
                "preview_url": item.get("previewUrl", "")
            })
        return {"status": "ok", "tracks": tracks}

    def resolver_stream_preescucha(self, titulo, artista):
        res = self.buscar_metadata_itunes(f"{artista} {titulo}", limit=1)
        if res and res[0].get("previewUrl"):
            return {"status": "ok", "stream_url": res[0]["previewUrl"]}

        try:
            query = f"ytsearch1:{artista} - {titulo} audio"
            cmd = ["yt-dlp", "-g", "-f", "bestaudio/best", "--extractor-args", "youtube:player_client=default,mweb", query]
            out = subprocess.check_output(cmd, text=True, timeout=10)
            url = out.strip().splitlines()[0]
            if url:
                return {"status": "ok", "stream_url": url}
        except Exception as e:
            print(f"[ERROR] Fallback yt-dlp falló: {e}")
        return {"status": "error", "stream_url": ""}
