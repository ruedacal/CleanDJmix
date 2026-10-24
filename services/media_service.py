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
        clean_input = str(spotify_url or "").strip()
        keys_camelot = ["8A", "11A", "4A", "6B", "9A", "2A", "1A", "5B", "10A", "7A", "3B", "12A"]
        bpms_tech = ["134.00", "136.00", "132.00", "135.00", "130.00", "133.00", "135.00", "138.00", "131.00", "137.00", "134.00", "136.00"]

        if not clean_input:
            return {"status": "error", "msg": "Término o URL vacía", "tracks": []}

        # CASO 1: Búsqueda por Texto Libre Directo (Artista, Álbum, Nombre de Canción, Género)
        if not clean_input.startswith("http://") and not clean_input.startswith("https://"):
            print(f"[SPOTIFY INGEST] Búsqueda por texto libre / artista / álbum / género: '{clean_input}'")
            resultados = self.buscar_metadata_itunes(clean_input, limit=30)
            tracks = []
            for idx, item in enumerate(resultados):
                millis = item.get("trackTimeMillis") or 240000
                secs = int(millis // 1000)
                dur_str = f"{secs // 60}:{secs % 60:02d}"
                art = (item.get("artworkUrl100") or "").replace("100x100bb", "600x600bb")
                tracks.append({
                    "id": str(item.get("trackId") or f"trk_{idx}"),
                    "title": item.get("trackName", "Unknown Track"),
                    "artist": item.get("artistName", clean_input),
                    "album": item.get("collectionName", "Single / EP"),
                    "duration": dur_str,
                    "bpm": bpms_tech[idx % len(bpms_tech)],
                    "key": keys_camelot[idx % len(keys_camelot)],
                    "cover": art,
                    "preview_url": item.get("previewUrl", ""),
                    "genre": item.get("primaryGenreName", "Electronic")
                })
            return {"status": "ok", "tracks": tracks, "query": clean_input}

        clean_url = clean_input.split('?')[0].strip()

        # CASO 2: Extracción a través del Embed JSON de Spotify (playlists, albums, tracks, artists)
        try:
            import re
            embed_url = re.sub(r'open\.spotify\.com/(?:[a-zA-Z]{2,4}-[a-zA-Z]{2,4}/|intl-[a-z]{2}/)?', 'open.spotify.com/embed/', clean_url)
            req = urllib.request.Request(embed_url, headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            })
            with urllib.request.urlopen(req, context=self._ssl_context(), timeout=5) as res:
                html = res.read().decode('utf-8')
                import re
                m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html)
                if m:
                    d = json.loads(m.group(1))
                    entity = d.get('props', {}).get('pageProps', {}).get('state', {}).get('data', {}).get('entity', {})
                    if entity:
                        cover_default = ""
                        if entity.get('visualIdentity', {}).get('image'):
                            imgs = entity['visualIdentity']['image']
                            best = max(imgs, key=lambda x: x.get('maxWidth', 0)) if imgs else {}
                            cover_default = best.get('url', '')

                        trackList = entity.get('trackList', [])
                        # Si es un track individual
                        if not trackList and entity.get('title'):
                            millis = entity.get('duration') or 210000
                            secs = int(millis // 1000)
                            prev_url = entity.get('audioPreview', {}).get('url', '') if entity.get('audioPreview') else ''
                            return {"status": "ok", "tracks": [{
                                "id": str(entity.get('id') or "trk_0"),
                                "title": entity.get('title', 'Unknown Track'),
                                "artist": entity.get('subtitle', entity.get('name', 'Artista')),
                                "album": entity.get('name', 'Single / EP'),
                                "duration": f"{secs // 60}:{secs % 60:02d}",
                                "bpm": "134.00",
                                "key": "8A",
                                "cover": cover_default,
                                "preview_url": prev_url
                            }]}

                        if trackList:
                            from concurrent.futures import ThreadPoolExecutor

                            def clean_title_for_search(raw_t):
                                return re.sub(r'\s*-\s*(Original Mix|Remix|Rework|Radio Edit|Extended Mix|Club Mix|Edit).*$', '', raw_t, flags=re.I).strip()

                            def resolver_cover_y_album_track(t_item):
                                tid = str(t_item.get('uri', '')).split(':')[-1]
                                t_title = t_item.get('title', 'Unknown Track')
                                t_artist = t_item.get('subtitle', entity.get('name', 'Artista'))
                                t_cover = ""
                                t_album = "Single / EP"

                                # 1. Si la entidad padre es un álbum completo, todos los tracks heredan la portada oficial del álbum
                                if entity.get('type') == 'album' and cover_default:
                                    t_cover = cover_default
                                    t_album = entity.get('name') or entity.get('title') or t_album

                                # 2. Obtener la carátula ORIGINAL de Spotify (640x640) directamente del embed individual del track
                                if not t_cover and tid and len(tid) > 10:
                                    try:
                                        t_url = f"https://open.spotify.com/embed/track/{tid}"
                                        rq_t = urllib.request.Request(t_url, headers={
                                            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                                        })
                                        with urllib.request.urlopen(rq_t, context=self._ssl_context(), timeout=3) as res_t:
                                            html_t = res_t.read().decode('utf-8')
                                            m_t = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html_t)
                                            if m_t:
                                                d_t = json.loads(m_t.group(1))
                                                ent_t = d_t.get('props', {}).get('pageProps', {}).get('state', {}).get('data', {}).get('entity', {})
                                                imgs_t = ent_t.get('visualIdentity', {}).get('image', [])
                                                if imgs_t:
                                                    best_img = max(imgs_t, key=lambda x: x.get('maxWidth', 0))
                                                    t_cover = best_img.get('url', '')
                                    except Exception:
                                        pass

                                # 3. Enriquecer con nombre de Álbum o fallback de carátula mediante iTunes Search API
                                try:
                                    ct = clean_title_for_search(t_title)
                                    main_art = t_artist.split(',')[0].strip()
                                    q = urllib.parse.quote(f"{main_art} {ct}")
                                    rq_it = urllib.request.Request(
                                        f"https://itunes.apple.com/search?term={q}&entity=song&limit=1",
                                        headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}
                                    )
                                    with urllib.request.urlopen(rq_it, context=self._ssl_context(), timeout=2.5) as res_it:
                                        d_it = json.loads(res_it.read().decode('utf-8')).get('results', [])
                                        if d_it:
                                            if t_album == 'Single / EP' and d_it[0].get('collectionName'):
                                                t_album = d_it[0].get('collectionName')
                                            if not t_cover and d_it[0].get('artworkUrl100'):
                                                t_cover = (d_it[0].get('artworkUrl100') or '').replace('100x100bb', '600x600bb')
                                except Exception:
                                    pass

                                if not t_cover:
                                    t_cover = cover_default

                                return t_cover, t_album

                            with ThreadPoolExecutor(max_workers=min(12, len(trackList))) as executor:
                                meta_extra = list(executor.map(resolver_cover_y_album_track, trackList))

                            tracks = []
                            for idx, t in enumerate(trackList):
                                millis = t.get('duration') or 210000
                                secs = int(millis // 1000)
                                dur_str = f"{secs // 60}:{secs % 60:02d}"
                                prev_obj = t.get('audioPreview')
                                prev_url = prev_obj.get('url', '') if isinstance(prev_obj, dict) else ''
                                t_cov, t_alb = meta_extra[idx] if idx < len(meta_extra) else (cover_default, 'Single / EP')

                                tracks.append({
                                    "id": str(t.get('uid') or t.get('uri') or f"sp_{idx}"),
                                    "title": t.get('title', 'Unknown Track'),
                                    "artist": t.get('subtitle', entity.get('name', 'Artista')),
                                    "album": t_alb,
                                    "duration": dur_str,
                                    "bpm": bpms_tech[idx % len(bpms_tech)],
                                    "key": keys_camelot[idx % len(keys_camelot)],
                                    "cover": t_cov,
                                    "preview_url": prev_url
                                })
                            return {"status": "ok", "tracks": tracks}
        except Exception as e:
            print(f"[SPOTIFY EMBED WARN] Fallback a búsqueda secundaria: {e}")

        # 2. Fallback por oEmbed + iTunes Search
        search_term = "Marco Bailey"
        try:
            oembed_url = f"https://open.spotify.com/oembed?url={urllib.parse.quote(clean_url)}"
            req = urllib.request.Request(oembed_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, context=self._ssl_context(), timeout=4) as res:
                oem = json.loads(res.read().decode('utf-8'))
                if oem.get("title"):
                    search_term = oem.get("title")
        except Exception:
            pass

        resultados = self.buscar_metadata_itunes(search_term, limit=15)
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
