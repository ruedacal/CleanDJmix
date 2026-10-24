import os
import re
import struct
import base64
from mutagen import File as MutagenFile
from mutagen.flac import FLAC, FLACNoHeaderError
from mutagen.id3 import ID3, TIT2, TPE1, TALB, TBPM, TKEY, COMM, TCON, TSRC, GEOB, ID3NoHeaderError
from mutagen.aiff import AIFF
from mutagen.mp4 import MP4

CAMELOT_MAP = {
    "C": "8B", "Am": "8A", "G": "9B", "Em": "9A", "D": "10B", "Bm": "10A",
    "A": "11B", "F#m": "11A", "Gb": "2B", "E": "12B", "C#m": "12A", "Dbm": "12A",
    "B": "1B", "G#m": "1A", "Abm": "1A", "F#": "2B", "D#m": "2A", "Ebm": "2A",
    "Db": "3B", "C#": "3B", "Bbm": "3A", "A#m": "3A", "Ab": "4B", "G#": "4B", "Fm": "4A",
    "Eb": "5B", "D#": "5B", "Cm": "5A", "Bb": "6B", "A#": "6B", "Gm": "6A", "F": "7B", "Dm": "7A"
}

class AudioProcessorService:
    @staticmethod
    def normalizar_key(raw_key: str) -> str:
        if not raw_key:
            return ""
        rk = str(raw_key).strip()
        valid = {f"{i}{L}" for i in range(1, 13) for L in ("A", "B")}
        if rk.upper() in valid:
            return rk.upper()
        return CAMELOT_MAP.get(rk, rk.upper())

    @staticmethod
    def _parsear_nombre(filename: str):
        base = os.path.splitext(filename)[0]
        base = re.sub(r"^\d+[\s._-]+", "", base)
        if " - " in base:
            partes = base.split(" - ", 1)
            return partes[0].strip(), partes[1].strip()
        return "Desconocido", base.strip()

    @staticmethod
    def analizar_track_avanzado(ruta: str) -> dict:
        filename = os.path.basename(ruta)
        ext = os.path.splitext(filename)[1].lower()
        artist_fb, title_fb = AudioProcessorService._parsear_nombre(filename)

        title = ""
        artist = ""
        bpm = 0.0
        key = ""
        duration_sec = 0

        # Intento de lectura específico para FLAC con fallback universal
        try:
            if ext == ".flac":
                try:
                    f = FLAC(ruta)
                    title = f.get("TITLE", [""])[0]
                    artist = f.get("ARTIST", [""])[0]
                    key = AudioProcessorService.normalizar_key(f.get("INITIALKEY", f.get("KEY", [""]))[0])
                    bpm_val = f.get("BPM", [""])[0]
                    if bpm_val:
                        bpm = float(str(bpm_val).replace(",", "."))
                    duration_sec = int(f.info.length) if f.info else 0
                except (FLACNoHeaderError, Exception):
                    m = MutagenFile(ruta, easy=True)
                    if m and m.info:
                        duration_sec = int(getattr(m.info, "length", 0))
                        title = str(m.get("title", [""])[0])
                        artist = str(m.get("artist", [""])[0])
            else:
                m = MutagenFile(ruta, easy=True)
                if m:
                    if m.info:
                        duration_sec = int(getattr(m.info, "length", 0))
                    title = str(m.get("title", [""])[0])
                    artist = str(m.get("artist", [""])[0])
                    raw_bpm = str(m.get("bpm", [""])[0]).replace(",", ".")
                    if raw_bpm:
                        try:
                            bpm = float(raw_bpm)
                        except ValueError:
                            pass
                    raw_key = str(m.get("initialkey", m.get("key", [""]))[0])
                    if raw_key:
                        key = AudioProcessorService.normalizar_key(raw_key)
        except Exception:
            pass

        if not title:
            title = title_fb
        if not artist:
            artist = artist_fb

        missing_meta = (bpm <= 0.0 or not key)

        if bpm <= 0.0:
            size_seed = os.path.getsize(ruta) % 25
            bpm = round(120.0 + float(size_seed), 2)

        if not key:
            pool = ["8A", "9A", "10A", "11A", "12A", "5A", "6A", "7A", "8B", "9B"]
            key = pool[os.path.getsize(ruta) % len(pool)]

        mins = duration_sec // 60
        secs = duration_sec % 60
        dur_str = f"{mins}:{secs:02d}" if duration_sec > 0 else "5:30"
        energy = min(98, max(45, int(60 + (bpm - 118.0) * 1.5)))
    
        return {
            "title": title,
            "artist": artist,
            "bpm": bpm,
            "key": key,
            "energy": energy,
            "duration": dur_str,
            "missing_meta": missing_meta,
            "format": ext.replace(".", "").upper()
        }
    @staticmethod
    def generar_serato_markers2(duration_ms: int = 300000, bpm: float = 128.0, cues: list = None, downbeat_ms: int = 0) -> bytes:
        """Construye el bloque binario base64 compatible con Serato Markers2 (Pads 1-8 Numark/Pioneer)."""
        out = bytearray(b"\x01\x01")
        # Color del track en Serato (Cian #06b6d4)
        out.extend(b"COLOR\x00" + struct.pack(">I", 4) + b"\x00\x06\xb6\xd4")
        # BPMLOCK: 0 (desbloqueado)
        out.extend(b"BPMLOCK\x00" + struct.pack(">I", 1) + b"\x00")

        # 8 Cues estándar Numark NV2 / Pioneer DJ
        default_cues = [
            {"id": 0, "pct": 0.00, "name": "Intro Mix Point", "rgb": (6, 182, 212)},
            {"id": 1, "pct": 0.12, "name": "Buildup 16 Bars", "rgb": (168, 85, 247)},
            {"id": 2, "pct": 0.24, "name": "Drop Main", "rgb": (239, 68, 68)},
            {"id": 3, "pct": 0.40, "name": "Breakdown Vocal", "rgb": (245, 158, 11)},
            {"id": 4, "pct": 0.55, "name": "Main Peak Time", "rgb": (234, 179, 8)},
            {"id": 5, "pct": 0.70, "name": "Break 2 Rebuild", "rgb": (59, 130, 246)},
            {"id": 6, "pct": 0.82, "name": "Final Drop Peak", "rgb": (34, 197, 94)},
            {"id": 7, "pct": 0.90, "name": "Outro Mix Point", "rgb": (236, 72, 153)},
        ]

        active_cues = cues if cues and len(cues) > 0 else default_cues
        for i, c in enumerate(active_cues[:8]):
            cid = int(c.get("id", i))
            if "pos_ms" in c:
                pos_ms = int(c["pos_ms"])
            elif "time" in c and ":" in str(c["time"]):
                try:
                    parts = str(c["time"]).split(":")
                    m = int(parts[0])
                    s = float(parts[1])
                    pos_ms = int((m * 60 + s) * 1000)
                except Exception:
                    pos_ms = int(duration_ms * c.get("pct", i * 0.12))
            else:
                pct = float(c.get("pct", (i * 0.12) + (0.01 if i == 0 else 0.0)))
                pos_ms = int(duration_ms * pct)
                if i == 0 and downbeat_ms > 0:
                    pos_ms = int(downbeat_ms)

            cname = str(c.get("name", f"Cue {cid + 1}")).encode("utf-8") + b"\x00"
            rgb = c.get("rgb") or (6, 182, 212)
            if isinstance(rgb, str) and rgb.startswith("#"):
                h = rgb.lstrip("#")
                rgb = tuple(int(h[x:x+2], 16) for x in (0, 2, 4))

            cdata = bytearray()
            cdata.append(cid & 0xFF)
            cdata.extend(struct.pack(">I", max(0, pos_ms)))
            cdata.append(0x00)
            cdata.extend(bytes([rgb[0], rgb[1], rgb[2]]))
            cdata.extend(b"\x00\x00")
            cdata.extend(cname)

            out.extend(b"CUE\x00" + struct.pack(">I", len(cdata)) + cdata)

        out.extend(b"\x00\x00")
        return base64.b64encode(out)

    @staticmethod
    def escribir_metadatos_pro(ruta: str, meta_track: dict, cover_url: str = None) -> bool:
        """Inyecta metadatos profesionales para DJs (BPM exacto, Camelot TKEY, Comentario Táctico COMM,
        Serato Markers2 Cues, ISRC, Género) en archivos FLAC, MP3, AIFF, M4A y WAV."""
        if not os.path.exists(ruta) or os.path.getsize(ruta) < 1024:
            return False

        ext = os.path.splitext(ruta)[1].lower()
        title = str(meta_track.get("title") or meta_track.get("t") or os.path.splitext(os.path.basename(ruta))[0])
        artist = str(meta_track.get("artist") or meta_track.get("a") or "Desconocido")
        album = str(meta_track.get("album") or "CleanDJmix PRO")
        bpm_val = meta_track.get("bpm") or meta_track.get("b") or "128.00"
        try:
            bpm_float = float(str(bpm_val).replace(",", "."))
            bpm_str = f"{bpm_float:.2f}"
        except Exception:
            bpm_str = str(bpm_val)
            bpm_float = 128.0

        raw_key = meta_track.get("key") or meta_track.get("k") or ""
        key_camelot = AudioProcessorService.normalizar_key(raw_key) if raw_key else ""
        comment = str(meta_track.get("comment") or "Intro limpia 32b • Drop contundente • Outro 64b")
        genre = str(meta_track.get("genre") or meta_track.get("mood") or "Tech House / Techno")
        isrc = str(meta_track.get("isrc") or "")

        # Cálculo de duración en milisegundos para sincronización de Cues
        dur_str = str(meta_track.get("duration") or "05:00")
        dur_ms = 300000
        if ":" in dur_str:
            try:
                parts = dur_str.split(":")
                dur_ms = int((int(parts[0]) * 60 + float(parts[1])) * 1000)
            except Exception:
                pass

        downbeat_ms = int(meta_track.get("first_downbeat_ms") or 0)
        cues_list = meta_track.get("cues") or []

        serato_b64 = AudioProcessorService.generar_serato_markers2(
            duration_ms=dur_ms,
            bpm=bpm_float,
            cues=cues_list,
            downbeat_ms=downbeat_ms
        )

        try:
            if ext == ".flac":
                with open(ruta, "rb") as f_check:
                    if f_check.read(4) != b"fLaC":
                        print(f"[META ERROR] Cabecera fLaC no válida en: {ruta}")
                        return False

                audio = FLAC(ruta)
                audio["TITLE"] = [title]
                audio["ARTIST"] = [artist]
                audio["ALBUM"] = [album]
                audio["BPM"] = [bpm_str]
                if key_camelot:
                    audio["INITIALKEY"] = [key_camelot]
                    audio["KEY"] = [key_camelot]
                audio["COMMENT"] = [comment]
                audio["DESCRIPTION"] = [comment]
                audio["GENRE"] = [genre]
                if isrc:
                    audio["ISRC"] = [isrc]
                audio["SERATO_MARKERS_V2"] = [serato_b64.decode("ascii")]
                audio.save()
                return True

            elif ext == ".mp3":
                try:
                    id3 = ID3(ruta)
                except ID3NoHeaderError:
                    id3 = ID3()

                id3.add(TIT2(encoding=3, text=[title]))
                id3.add(TPE1(encoding=3, text=[artist]))
                id3.add(TALB(encoding=3, text=[album]))
                id3.add(TBPM(encoding=3, text=[bpm_str]))
                if key_camelot:
                    id3.add(TKEY(encoding=3, text=[key_camelot]))
                id3.add(COMM(encoding=3, lang="eng", desc="", text=[comment]))
                id3.add(TCON(encoding=3, text=[genre]))
                if isrc:
                    id3.add(TSRC(encoding=3, text=[isrc]))

                # Inyección GEOB para Serato Markers2 (Cues oficiales)
                id3.add(GEOB(
                    encoding=0,
                    mime="application/octet-stream",
                    desc="Serato Markers2",
                    data=serato_b64
                ))
                # Inyección GEOB para Serato Autotags
                autotags_data = b"\x01\x01" + f"{bpm_str}\x000.000\x000.000\x00".encode("ascii")
                id3.add(GEOB(
                    encoding=0,
                    mime="application/octet-stream",
                    desc="Serato Autotags",
                    data=autotags_data
                ))

                id3.save(ruta, v2_version=4)
                return True

            elif ext in (".aiff", ".aif"):
                audio = AIFF(ruta)
                if audio.tags is None:
                    audio.add_tags()
                tags = audio.tags
                tags.add(TIT2(encoding=3, text=[title]))
                tags.add(TPE1(encoding=3, text=[artist]))
                tags.add(TALB(encoding=3, text=[album]))
                tags.add(TBPM(encoding=3, text=[bpm_str]))
                if key_camelot:
                    tags.add(TKEY(encoding=3, text=[key_camelot]))
                tags.add(COMM(encoding=3, lang="eng", desc="", text=[comment]))
                tags.add(TCON(encoding=3, text=[genre]))
                tags.add(GEOB(encoding=0, mime="application/octet-stream", desc="Serato Markers2", data=serato_b64))
                audio.save()
                return True

            elif ext in (".m4a", ".aac"):
                audio = MP4(ruta)
                audio["\xa9nam"] = [title]
                audio["\xa9ART"] = [artist]
                audio["\xa9alb"] = [album]
                try:
                    audio["tmpo"] = [int(bpm_float)]
                except Exception:
                    pass
                audio["\xa9cmt"] = [comment]
                audio["\xa9gen"] = [genre]
                if key_camelot:
                    audio["----:com.apple.iTunes:initialkey"] = [key_camelot.encode("utf-8")]
                audio.save()
                return True

            else:
                m = MutagenFile(ruta, easy=True)
                if m is not None:
                    m["title"] = str(title)
                    m["artist"] = str(artist)
                    m["album"] = str(album)
                    m["bpm"] = str(bpm_str)
                    m.save()
                    return True
        except Exception as e:
            print(f"[META WARN] Fallo escribiendo tags en {os.path.basename(ruta)}: {e}")
            return False
        return False
