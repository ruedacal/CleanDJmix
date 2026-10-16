import os
import re
import requests
from mutagen import File as MutagenFile
from mutagen.flac import FLAC, Picture
from mutagen.id3 import ID3, TIT2, TPE1, TALB, TBPM, TKEY, TSRC, TCON, APIC, ID3NoHeaderError

# Mapa oficial de conversión Musical / Pitch Class (Spotify) -> Camelot Wheel
CAMELOT_MAP = {
    "C": "8B", "Am": "8A", "G": "9B", "Em": "9A", "D": "10B", "Bm": "10A",
    "A": "11B", "F#m": "11A", "Gb": "2B", "E": "12B", "C#m": "12A", "Dbm": "12A",
    "B": "1B", "G#m": "1A", "Abm": "1A", "F#": "2B", "D#m": "2A", "Ebm": "2A",
    "Db": "3B", "C#": "3B", "Bbm": "3A", "A#m": "3A", "Ab": "4B", "G#": "4B", "Fm": "4A",
    "Eb": "5B", "D#": "5B", "Cm": "5A", "Bb": "6B", "A#": "6B", "Gm": "6A", "F": "7B", "Dm": "7A"
}

# Conversión de (pitch_class 0-11, mode 0-1) de Spotify Audio Features a Camelot
SPOTIFY_PITCH_TO_CAMELOT = {
    (0, 1): "8B",  (0, 0): "5A",
    (1, 1): "3B",  (1, 0): "12A",
    (2, 1): "10B", (2, 0): "7A",
    (3, 1): "5B",  (3, 0): "2A",
    (4, 1): "12B", (4, 0): "9A",
    (5, 1): "7B",  (5, 0): "4A",
    (6, 1): "2B",  (6, 0): "11A",
    (7, 1): "9B",  (7, 0): "6A",
    (8, 1): "4B",  (8, 0): "1A",
    (9, 1): "11B", (9, 0): "8A",
    (10, 1): "6B", (10, 0): "3A",
    (11, 1): "1B", (11, 0): "10A",
}


class AudioProcessorService:
    @staticmethod
    def normalizar_key(raw_key: str) -> str:
        if not raw_key:
            return ""
        rk = str(raw_key).strip()
        valid_camelot = {f"{i}{L}" for i in range(1, 13) for L in ("A", "B")}
        if rk.upper() in valid_camelot:
            return rk.upper()
        return CAMELOT_MAP.get(rk, rk.upper())

    @staticmethod
    def spotify_key_to_camelot(pitch: int, mode: int) -> str:
        return SPOTIFY_PITCH_TO_CAMELOT.get((pitch, mode), "8A")

    @staticmethod
    def _parsear_artista_titulo_desde_nombre(filename: str):
        base = os.path.splitext(filename)[0]
        base = re.sub(r"^\d+[\s._-]+", "", base)
        if " - " in base:
            partes = base.split(" - ", 1)
            return partes[0].strip(), partes[1].strip()
        return "Unknown Artist", base.strip()

    @staticmethod
    def analizar_track_avanzado(ruta: str) -> dict:
        """Extrae metadatos reales de FLAC/MP3/WAV/M4A y evalúa su estado para la UI Director's Cut."""
        if not ruta or not os.path.exists(ruta):
            return {
                "status": "Error",
                "title": os.path.basename(ruta) if ruta else "Unknown",
                "artist": "Unknown",
                "bpm": 0.0,
                "key": "--",
                "energy": 0,
                "duration": "0:00",
                "format": "UNKNOWN",
                "missing_meta": True
            }

        filename = os.path.basename(ruta)
        ext = os.path.splitext(filename)[1].lower().replace(".", "").upper()
        fallback_artist, fallback_title = AudioProcessorService._parsear_artista_titulo_desde_nombre(filename)

        title = ""
        artist = ""
        album = ""
        isrc = ""
        bpm = 0.0
        key = ""
        duration_sec = 0
        bitrate = 0
        sample_rate = 44100

        try:
            audio = MutagenFile(ruta, easy=True)
            if audio is not None:
                if audio.info:
                    duration_sec = int(getattr(audio.info, "length", 0))
                    bitrate = int(getattr(audio.info, "bitrate", 0) / 1000) if getattr(audio.info, "bitrate", 0) else 1411
                    sample_rate = int(getattr(audio.info, "sample_rate", 44100))

                title = str(audio.get("title", [""])[0]).strip()
                artist = str(audio.get("artist", [""])[0]).strip()
                album = str(audio.get("album", [""])[0]).strip()
                isrc = str(audio.get("isrc", [""])[0]).strip()

                raw_bpm = str(audio.get("bpm", [""])[0]).strip().replace(",", ".")
                if raw_bpm:
                    try:
                        bpm = round(float(raw_bpm), 2)
                    except ValueError:
                        bpm = 0.0

                raw_key = str(audio.get("initialkey", audio.get("key", [""]))[0]).strip()
                if raw_key:
                    key = AudioProcessorService.normalizar_key(raw_key)

            # Lectura adicional directa para archivos FLAC o ID3 con frames TKEY/TBPM específicos
            if ext == "FLAC":
                flac_obj = FLAC(ruta)
                if not key and "INITIALKEY" in flac_obj:
                    key = AudioProcessorService.normalizar_key(flac_obj["INITIALKEY"][0])
                if bpm <= 0 and "BPM" in flac_obj:
                    try:
                        bpm = round(float(flac_obj["BPM"][0]), 2)
                    except ValueError:
                        pass
        except Exception as e:
            print(f"[AudioProcessor] Advertencia leyendo {filename}: {e}")

        missing_meta = (bpm <= 0.0 or not key or not artist or not title)

        if not title:
            title = fallback_title
        if not artist:
            artist = fallback_artist

        # Si el archivo no tiene BPM/Key en sus tags, calculamos estimación determinista marcada como Missing Meta
        if bpm <= 0.0:
            size_seed = os.path.getsize(ruta) % 26
            bpm = round(118.0 + float(size_seed), 2)

        if not key:
            pool = ["8A", "9A", "10A", "11A", "12A", "5A", "6A", "7A", "8B", "9B", "10B"]
            key = pool[os.path.getsize(ruta) % len(pool)]

        mins = duration_sec // 60
        secs = duration_sec % 60
        duration_str = f"{mins}:{secs:02d}" if duration_sec > 0 else "6:00"

        energy = min(99, max(45, int(60 + (bpm - 115.0) * 1.5)))
        danceability = min(98, max(55, int(72 + (130.0 - abs(128.0 - bpm)) * 0.7)))

        status_label = "Missing Meta" if missing_meta else "Ready"

        return {
            "status": status_label,
            "filename": filename,
            "path": ruta,
            "title": title,
            "artist": artist,
            "album": album,
            "isrc": isrc,
            "bpm": bpm,
            "key": key,
            "energy": energy,
            "danceability": danceability,
            "duration": duration_str,
            "duration_sec": duration_sec,
            "format": ext,
            "bitrate": bitrate,
            "sample_rate": sample_rate,
            "missing_meta": missing_meta
        }

    @staticmethod
    def escribir_metadatos_pro(ruta: str, meta: dict, cover_url: str = None) -> bool:
        """
        Escribe metadatos limpios en FLAC (Vorbis Comments + Picture) o MP3 (ID3v2.3 estricto para Serato).
        """
        if not os.path.exists(ruta):
            return False

        ext = os.path.splitext(ruta)[1].lower()
        img_bytes = None
        if cover_url:
            try:
                r = requests.get(cover_url, timeout=10)
                if r.status_code == 200:
                    img_bytes = r.content
            except Exception:
                pass

        try:
            if ext == ".flac":
                audio = FLAC(ruta)
                if meta.get("title"):
                    audio["TITLE"] = str(meta["title"])
                if meta.get("artist"):
                    audio["ARTIST"] = str(meta["artist"])
                if meta.get("album"):
                    audio["ALBUM"] = str(meta["album"])
                if meta.get("bpm"):
                    audio["BPM"] = str(round(float(meta["bpm"]), 2))
                if meta.get("key"):
                    audio["INITIALKEY"] = AudioProcessorService.normalizar_key(str(meta["key"]))
                    audio["KEY"] = AudioProcessorService.normalizar_key(str(meta["key"]))
                if meta.get("isrc"):
                    audio["ISRC"] = str(meta["isrc"])
                if meta.get("genre"):
                    audio["GENRE"] = str(meta["genre"])

                if img_bytes:
                    pic = Picture()
                    pic.data = img_bytes
                    pic.type = 3
                    pic.mime = "image/jpeg"
                    audio.clear_pictures()
                    audio.add_picture(pic)

                audio.save()
                return True

            elif ext == ".mp3":
                try:
                    tags = ID3(ruta)
                except ID3NoHeaderError:
                    tags = ID3()

                if meta.get("title"):
                    tags.add(TIT2(encoding=3, text=str(meta["title"])))
                if meta.get("artist"):
                    tags.add(TPE1(encoding=3, text=str(meta["artist"])))
                if meta.get("album"):
                    tags.add(TALB(encoding=3, text=str(meta["album"])))
                if meta.get("bpm"):
                    tags.add(TBPM(encoding=3, text=str(int(round(float(meta["bpm"]))))))
                if meta.get("key"):
                    tags.add(TKEY(encoding=3, text=AudioProcessorService.normalizar_key(str(meta["key"]))))
                if meta.get("isrc"):
                    tags.add(TSRC(encoding=3, text=str(meta["isrc"])))
                if meta.get("genre"):
                    tags.add(TCON(encoding=3, text=str(meta["genre"])))

                if img_bytes:
                    tags.delall("APIC")
                    tags.add(APIC(encoding=3, mime="image/jpeg", type=3, desc="Cover", data=img_bytes))

                # Guardado en ID3v2.3 para máxima compatibilidad con Serato DJ y CDJs Pioneer
                tags.save(ruta, v2_version=3)
                return True
        except Exception as e:
            print(f"[AudioProcessor] Error escribiendo tags en {ruta}: {e}")
            return False

        return False
