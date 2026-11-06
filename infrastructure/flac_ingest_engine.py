import os
import re
import shutil
import threading
import subprocess
import requests
from mutagen.flac import FLAC, Picture


class FlacIngestEngine:
    def __init__(self, output_dir="/Users/admin/Music/mi musica"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

        self.session = requests.Session()
        adapter = requests.adapters.HTTPAdapter(max_retries=3)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        })

    def _limpiar_nombre(self, texto: str) -> str:
        limpio = re.sub(r'[\\/*?:"<>|]', "-", str(texto or "")).strip()
        return limpio or "Unknown"

    def _obtener_binario(self, nombre: str) -> str:
        ruta = shutil.which(nombre)
        if ruta:
            return ruta
        for p in [f"/opt/homebrew/bin/{nombre}", f"/usr/local/bin/{nombre}"]:
            if os.path.exists(p):
                return p
        return nombre

    def _extraer_info_spotify(self, track_or_query):
        """
        Extrae metadatos completos y duración esperada de la pista.
        """
        if isinstance(track_or_query, dict):
            artista = track_or_query.get("artist") or track_or_query.get("artista") or "Unknown Artist"
            titulo = track_or_query.get("title") or track_or_query.get("titulo") or "Unknown Track"
            album = track_or_query.get("album") or "Single / EP"
            bpm = str(track_or_query.get("bpm") or "135.00")
            key = str(track_or_query.get("key") or "8A")
            cover = (track_or_query.get("cover") or track_or_query.get("cover_url") or "").replace("100x100bb", "600x600bb").replace("300x300bb", "600x600bb")
            preview_url = track_or_query.get("preview_url") or track_or_query.get("audio_preview") or ""
        else:
            texto = str(track_or_query).strip()
            if " - " in texto:
                artista, titulo = texto.split(" - ", 1)
            else:
                artista, titulo = "Artist", texto
            album, bpm, key, cover, preview_url = "Single / EP", "135.00", "8A", "", ""

        if not cover or album == "Single / EP":
            try:
                res = self.session.get(
                    "https://itunes.apple.com/search",
                    params={"term": f"{artista} {titulo}", "entity": "song", "limit": 1},
                    timeout=5
                )
                if res.status_code == 200:
                    items = res.json().get("results", [])
                    if items:
                        it = items[0]
                        if not cover and it.get("artworkUrl100"):
                            cover = it["artworkUrl100"].replace("100x100bb", "600x600bb")
                        if album == "Single / EP" and it.get("collectionName"):
                            album = it.get("collectionName")
                        preview_url = preview_url or it.get("previewUrl", "")
            except Exception:
                pass

        return {
            "artist": artista.strip(),
            "title": titulo.strip(),
            "album": album.strip(),
            "bpm": bpm,
            "key": key,
            "cover_url": cover,
            "preview_url": preview_url
        }

    def _descargar_master_completo(self, metadata: dict, filepath_final: str, formato: str) -> bool:
        """
        Descarga el track de duración completa (Full-Length Master) resolviendo el JS challenge
        con --remote-components ejs:github y convirtiendo a FLAC real.
        """
        ytdlp_bin = self._obtener_binario("yt-dlp")
        ffmpeg_bin = self._obtener_binario("ffmpeg")
        tiene_ffmpeg = os.path.exists(ffmpeg_bin) or shutil.which("ffmpeg") is not None
        ffmpeg_dir = os.path.dirname(ffmpeg_bin) if ("/" in ffmpeg_bin and os.path.exists(ffmpeg_bin)) else ""

        artista = metadata["artist"]
        titulo = metadata["title"]
        ext = formato.lower().strip(".") or "flac"

        base_sin_ext = os.path.splitext(filepath_final)[0]
        plantilla_out = f"{base_sin_ext}.%(ext)s"

        # Limpiar residuos previos
        for ext_tmp in [ext, "webm", "m4a", "mp3", "opus", "part"]:
            posible = f"{base_sin_ext}.{ext_tmp}"
            if os.path.exists(posible):
                try:
                    os.remove(posible)
                except OSError:
                    pass

        # Argumentos comunes de post-procesado si existe ffmpeg, o descarga directa si no existe
        post_args = ["--extract-audio", "--audio-format", ext, "--audio-quality", "0"] if tiene_ffmpeg else []
        if ffmpeg_dir:
            post_args.extend(["--ffmpeg-location", ffmpeg_dir])

        estrategias = [
            # Estrategia 1: YouTube Master con solver oficial EJS de GitHub + cliente web/tv
            [
                ytdlp_bin, "--no-playlist", "--no-cache-dir",
                "--remote-components", "ejs:github",
                "-f", "bestaudio/best",
                *post_args,
                "-o", plantilla_out,
                f"ytsearch1:{artista} - {titulo} Original Mix"
            ],
            # Estrategia 2: Cliente tv_embedded + web_creator (evita SABR issue #12482 y PO Token)
            [
                ytdlp_bin, "--no-playlist", "--no-cache-dir",
                "--extractor-args", "youtube:player_client=tv,web_creator",
                "-f", "bestaudio/best",
                *post_args,
                "-o", plantilla_out,
                f"ytsearch1:{artista} {titulo}"
            ],
            # Estrategia 3: SoundCloud Full Track (filtrando previews cortos < 90s)
            [
                ytdlp_bin, "--no-playlist", "--no-cache-dir",
                "--match-filter", "duration > 90",
                "-f", "bestaudio/best",
                *post_args,
                "-o", plantilla_out,
                f"scsearch3:{artista} {titulo}"
            ]
        ]

        for idx, cmd in enumerate(estrategias, start=1):
            print(f"[MASTER ENGINE] Intento {idx}/3 descargando pista completa: {artista} - {titulo} -> .{ext.upper()}")
            try:
                subprocess.run(cmd, check=True, timeout=180)
                # Verificar si se generó el archivo final o un contenedor de audio directo (m4a/webm/mp3)
                if os.path.exists(filepath_final) and os.path.getsize(filepath_final) > 1024 * 1024:
                    return True
                for cand_ext in ["webm", "m4a", "mp3", "opus"]:
                    cand_path = f"{base_sin_ext}.{cand_ext}"
                    if os.path.exists(cand_path) and os.path.getsize(cand_path) > 1024 * 1024:
                        if tiene_ffmpeg:
                            subprocess.run([ffmpeg_bin, "-y", "-i", cand_path, "-c:a", "flac", filepath_final], check=True)
                            os.remove(cand_path)
                        else:
                            shutil.move(cand_path, filepath_final)
                        return True
            except Exception as e:
                print(f"[WARN MASTER ENGINE] Estrategia {idx} reportó: {e}")

        return os.path.exists(filepath_final) and os.path.getsize(filepath_final) > 1024 * 1024

    def _etiquetar_archivo_flac(self, filepath, metadata):
        """
        Inyección física de metadatos (BPM, Key, Cover Art HD 600x600) mediante Mutagen.
        """
        try:
            if not os.path.exists(filepath):
                return
            with open(filepath, "rb") as f:
                magic = f.read(4)
            if magic != b"fLaC":
                return

            audio = FLAC(filepath)
            audio["title"] = metadata["title"]
            audio["artist"] = metadata["artist"]
            audio["album"] = metadata["album"]
            audio["bpm"] = str(metadata["bpm"])
            audio["initialkey"] = str(metadata["key"])

            if metadata.get("cover_url"):
                res_img = self.session.get(metadata["cover_url"], timeout=10)
                if res_img.status_code == 200:
                    image = Picture()
                    image.type = 3  # Cover (front)
                    image.mime = "image/jpeg"
                    image.desc = "Cover"
                    image.data = res_img.content
                    audio.clear_pictures()
                    audio.add_picture(image)

            audio.save()
            tamano_mb = os.path.getsize(filepath) / (1024 * 1024)
            print(f"[OK] FLAC Completo ({tamano_mb:.2f} MB) etiquetado en disco: {filepath}")
        except Exception as e:
            print(f"[WARN] Aviso aplicando tags Mutagen: {e}")

    def descargar_flac_sync(self, track_or_url, callback_progreso=None, formato="flac"):
        """
        Descarga síncrona de pista completa (35-60 MB en FLAC) con inyección de metadatos DJ.
        """
        cb = callback_progreso if callable(callback_progreso) else (lambda estado, datos: None)
        try:
            cb("analizando", "Extrayendo metadatos HD...")
            meta = self._extraer_info_spotify(track_or_url)

            artista_safe = self._limpiar_nombre(meta["artist"])
            titulo_safe = self._limpiar_nombre(meta["title"])
            ext = formato.lower().strip(".") or "flac"

            os.makedirs(self.output_dir, exist_ok=True)
            nombre_archivo = f"{artista_safe} - {titulo_safe}.{ext}"
            filepath_final = os.path.join(self.output_dir, nombre_archivo)

            cb("descargando", f"Descargando Master Completo: {meta['artist']} - {meta['title']}...")
            exito_master = self._descargar_master_completo(meta, filepath_final, ext)

            if not exito_master or not os.path.exists(filepath_final):
                raise RuntimeError(f"No se pudo obtener el máster completo de {meta['artist']} - {meta['title']}")

            if ext == "flac":
                cb("etiquetando", "Inyectando etiquetas BPM, Key y Carátula HD...")
                self._etiquetar_archivo_flac(filepath_final, meta)

            tamano_mb = os.path.getsize(filepath_final) / (1024 * 1024)
            print(f"[EXITO INGEST] Pista completa ({tamano_mb:.2f} MB) guardada en: {filepath_final}")
            cb("completado", {"path": filepath_final, "meta": meta})
            return {"status": "ok", "path": filepath_final, "meta": meta}

        except Exception as e:
            print(f"[ERROR CRÍTICO] Fallo en la ingesta: {e}")
            cb("error", str(e))
            return {"status": "error", "error": str(e)}

    def descargar_flac_async(self, spotify_url, callback_progreso=None):
        cb = callback_progreso if callable(callback_progreso) else (lambda estado, datos: None)

        def worker():
            self.descargar_flac_sync(spotify_url, cb)

        hilo = threading.Thread(target=worker, daemon=True)
        hilo.start()
        return {"status": "ok", "msg": "Proceso de ingesta iniciado en background"}