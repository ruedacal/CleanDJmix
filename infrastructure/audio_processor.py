import os
import re
import struct
import base64
from mutagen import File as MutagenFile
from mutagen.flac import FLAC, FLACNoHeaderError, Picture
from mutagen.id3 import ID3, TIT2, TPE1, TALB, TBPM, TKEY, COMM, TCON, TSRC, GEOB, TXXX, APIC, ID3NoHeaderError
from mutagen.aiff import AIFF
from mutagen.mp4 import MP4, MP4Cover

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
    def detectar_trim_y_downbeat(ruta: str) -> tuple:
        """Calcula el punto de recorte de silencio (zero-crossing) en ms y el primer
        transitorio de bombo/downbeat (Beatgrid 1.0.0) en ms usando DSP rápido."""
        if not ruta or not os.path.exists(ruta) or os.path.getsize(ruta) < 1024:
            return 0.0, 0.0
        try:
            import soundfile as sf
            import numpy as np

            # Leer hasta 8 segundos
            data, sr = sf.read(ruta, frames=8 * 44100, dtype="float32")
            if len(data) == 0:
                return 0.0, 0.0
            if data.ndim > 1:
                mono = np.mean(data, axis=1)
            else:
                mono = data

            # 1. Zero-crossing Silence Trim (-60 dBFS -> linear ~ 0.001)
            threshold = 0.001
            above_thresh = np.where(np.abs(mono) > threshold)[0]
            if len(above_thresh) == 0:
                return 0.0, 0.0

            first_audible_idx = int(above_thresh[0])
            if first_audible_idx > 0:
                signs = np.signbit(mono[:first_audible_idx + 1])
                diffs = np.where(np.diff(signs))[0]
                zero_cross_idx = int(diffs[-1]) if len(diffs) > 0 else first_audible_idx
            else:
                zero_cross_idx = 0

            trim_ms = round(float(zero_cross_idx) / sr * 1000.0, 1)

            # 2. Downbeat detection (Primer golpe de bombo / transitorio de energía)
            sub_audio = mono[zero_cross_idx:zero_cross_idx + int(sr * 4.0)]
            frame_len = int(sr * 0.010)  # 10ms
            hop_len = int(sr * 0.002)    # 2ms

            if len(sub_audio) > frame_len:
                num_frames = (len(sub_audio) - frame_len) // hop_len
                frames = np.lib.stride_tricks.as_strided(
                    sub_audio,
                    shape=(num_frames, frame_len),
                    strides=(sub_audio.strides[0] * hop_len, sub_audio.strides[0])
                )
                energies = np.sqrt(np.mean(frames ** 2, axis=1))
                energy_diff = np.maximum(0, np.diff(energies))

                max_val = float(np.max(energy_diff)) if len(energy_diff) > 0 else 0.0
                if max_val > 0.005:
                    peaks = np.where(energy_diff > (max_val * 0.25))[0]
                    if len(peaks) > 0:
                        first_peak = int(peaks[0])
                        downbeat_ms = round(trim_ms + (float(first_peak * hop_len) / sr * 1000.0), 1)
                    else:
                        downbeat_ms = trim_ms
                else:
                    downbeat_ms = trim_ms
            else:
                downbeat_ms = trim_ms

            return trim_ms, downbeat_ms
        except Exception:
            return 0.0, 0.0

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
        trim_start_ms = 0.0
        first_downbeat_ms = 0.0
        danceability_val = 0
        mood_val = ""
        genre_val = "Tech House"
        subgenre_val = ""

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
                    trim_raw = f.get("TRIM_START_MS", [""])[0]
                    down_raw = f.get("FIRST_DOWNBEAT_MS", [""])[0]
                    dance_raw = f.get("DANCEABILITY", [""])[0]
                    mood_raw = f.get("MOOD", [""])[0]
                    raw_genre = f.get("GENRE", [""])[0]
                    raw_subgenre = f.get("SUBGENRE", [""])[0]
                    if raw_genre:
                        genre_val = str(raw_genre)
                    if raw_subgenre:
                        subgenre_val = str(raw_subgenre)
                    if trim_raw:
                        try:
                            trim_start_ms = float(trim_raw)
                        except Exception:
                            pass
                    if down_raw:
                        try:
                            first_downbeat_ms = float(down_raw)
                        except Exception:
                            pass
                    if dance_raw:
                        try:
                            danceability_val = int(dance_raw)
                        except Exception:
                            pass
                    if mood_raw:
                        mood_val = str(mood_raw)
                except (FLACNoHeaderError, Exception):
                    m = MutagenFile(ruta, easy=True)
                    if m and m.info:
                        duration_sec = int(getattr(m.info, "length", 0))
                        title = str(m.get("title", [""])[0])
                        artist = str(m.get("artist", [""])[0])
                        genre_val = str(m.get("genre", ["Tech House"])[0])
            else:
                try:
                    id3_tags = ID3(ruta)
                    t_frame = id3_tags.get("TXXX:TRIM_START_MS")
                    d_frame = id3_tags.get("TXXX:FIRST_DOWNBEAT_MS")
                    dance_frame = id3_tags.get("TXXX:DANCEABILITY")
                    mood_frame = id3_tags.get("TXXX:MOOD")
                    tcon_frame = id3_tags.get("TCON")
                    subg_frame = id3_tags.get("TXXX:SUBGENRE")
                    if tcon_frame and tcon_frame.text:
                        genre_val = str(tcon_frame.text[0])
                    if subg_frame and subg_frame.text:
                        subgenre_val = str(subg_frame.text[0])
                    if t_frame and t_frame.text:
                        trim_start_ms = float(t_frame.text[0])
                    if d_frame and d_frame.text:
                        first_downbeat_ms = float(d_frame.text[0])
                    if dance_frame and dance_frame.text:
                        try:
                            danceability_val = int(dance_frame.text[0])
                        except Exception:
                            pass
                    if mood_frame and mood_frame.text:
                        mood_val = str(mood_frame.text[0])
                except Exception:
                    pass

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
                    if not genre_val or genre_val == "Tech House":
                        m_genre = str(m.get("genre", [""])[0])
                        if m_genre:
                            genre_val = m_genre
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

        if trim_start_ms <= 0.0 and first_downbeat_ms <= 0.0:
            trim_start_ms, first_downbeat_ms = AudioProcessorService.detectar_trim_y_downbeat(ruta)

        mins = duration_sec // 60
        secs = duration_sec % 60
        dur_str = f"{mins}:{secs:02d}" if duration_sec > 0 else "5:30"
        energy = min(98, max(45, int(60 + (bpm - 118.0) * 1.5)))

        if danceability_val <= 0:
            danceability_val = min(98, max(50, int(92 - abs(bpm - 126.0) * 0.9)))

        dur_ms = int(duration_sec * 1000) if duration_sec > 0 else 300000
        cues = AudioProcessorService.calcular_8_hot_cues_fraseo(
            duration_ms=dur_ms,
            bpm=bpm,
            downbeat_ms=int(first_downbeat_ms)
        )

        subtag_val = ""
        valence_val = 50
        arousal_val = energy
        try:
            from services.mood_intelligence_service import MoodIntelligenceService
            mood_res = MoodIntelligenceService.clasificar_mood(
                bpm=bpm,
                key=key,
                energy=energy,
                danceability=danceability_val,
                filepath=ruta
            )
            if not mood_val:
                mood_val = mood_res.get("mood", "Peak Time")
            subtag_val = mood_res.get("subtag", f"{mood_val} / Driving")
            valence_val = mood_res.get("valence", 50)
            arousal_val = mood_res.get("arousal", energy)
            tactical_comment = MoodIntelligenceService.generar_comentario_tactico(
                bpm=bpm,
                key=key,
                mood=mood_val,
                subtag=subtag_val,
                energy=energy,
                cues=cues,
                first_downbeat_ms=first_downbeat_ms,
                lang="es"
            )
        except Exception as e:
            if not mood_val:
                mood_val = "Peak Time"
            subtag_val = f"{mood_val} / Driving"
            tactical_comment = f"[{bpm:.1f} BPM | {key}] Intro limpia 32b • Drop contundente • Outro 64b"

        if " / " in genre_val:
            parts = genre_val.split(" / ", 1)
            genre_val = parts[0].strip()
            if not subgenre_val:
                subgenre_val = parts[1].strip()

        return {
            "title": title,
            "artist": artist,
            "bpm": bpm,
            "key": key,
            "energy": energy,
            "danceability": danceability_val,
            "dance": danceability_val,
            "mood": mood_val,
            "mood_subtag": subtag_val,
            "valence": valence_val,
            "arousal": arousal_val,
            "comment": tactical_comment,
            "genre": genre_val,
            "subgenre": subgenre_val,
            "duration": dur_str,
            "missing_meta": missing_meta,
            "format": ext.replace(".", "").upper(),
            "sample_rate_khz": 44.1,
            "bitrate_kbps": 320 if ext == ".mp3" else 1411,
            "bit_depth": 16,
            "trim_start_ms": trim_start_ms,
            "first_downbeat_ms": first_downbeat_ms,
            "cues": cues
        }

    @staticmethod
    def calcular_8_hot_cues_fraseo(duration_ms: int = 300000, bpm: float = 128.0, downbeat_ms: int = 0) -> list:
        """Calcula automáticamente los 8 Hot Cues estándar (Pads Numark NV2 / Pioneer DJ)
        sincronizados a compases y frases musicales (16 y 32 compases) anclados al Beatgrid 1.0.0."""
        try:
            bpm_clean = float(bpm) if bpm and float(bpm) > 20.0 else 128.0
        except Exception:
            bpm_clean = 128.0

        try:
            dur_clean = int(duration_ms) if duration_ms and int(duration_ms) > 1000 else 300000
        except Exception:
            dur_clean = 300000

        try:
            downbeat_clean = max(0, int(downbeat_ms))
        except Exception:
            downbeat_clean = 0

        # Duración de 1 beat (negra) y 1 compás (4/4 = 4 beats) en milisegundos
        beat_ms = 60000.0 / bpm_clean
        bar_ms = beat_ms * 4.0

        # Total de compases en el track
        usable_dur = max(1000, dur_clean - downbeat_clean)
        total_bars = max(8.0, usable_dur / bar_ms)

        # Distribución armónica de frases según la longitud del track
        if total_bars >= 144:
            bar_offsets = [0, 16, 32, 64, 96, 128, 160]
            outro_offset = max(bar_offsets[-1] + 16, int(total_bars - 16))
            bar_offsets.append(outro_offset)
        elif total_bars >= 96:
            bar_offsets = [0, 16, 32, 48, 64, 80, 96]
            outro_offset = max(bar_offsets[-1] + 8, int(total_bars - 16))
            bar_offsets.append(outro_offset)
        elif total_bars >= 48:
            bar_offsets = [0, 8, 16, 24, 32, 40, 48]
            outro_offset = max(bar_offsets[-1] + 8, int(total_bars - 8))
            bar_offsets.append(outro_offset)
        else:
            step = max(1.0, total_bars / 8.0)
            bar_offsets = [int(i * step) for i in range(8)]

        cue_configs = [
            {"id": 1, "name": "Kick / Intro", "color": "#ef4444", "rgb": (239, 68, 68), "text": "text-red-400", "border": "border-red-500/50", "bg": "bg-red-500/10"},
            {"id": 2, "name": "Hi-Hats In", "color": "#f97316", "rgb": (249, 115, 22), "text": "text-orange-400", "border": "border-orange-500/50", "bg": "bg-orange-500/10"},
            {"id": 3, "name": "Bassline", "color": "#eab308", "rgb": (234, 179, 8), "text": "text-yellow-400", "border": "border-yellow-500/50", "bg": "bg-yellow-500/10"},
            {"id": 4, "name": "Main Break", "color": "#22c55e", "rgb": (34, 197, 94), "text": "text-green-400", "border": "border-green-500/50", "bg": "bg-green-500/10"},
            {"id": 5, "name": "Drop 1 (Climax)", "color": "#06b6d4", "rgb": (6, 182, 212), "text": "text-cyan-400", "border": "border-cyan-500/50", "bg": "bg-cyan-500/10"},
            {"id": 6, "name": "Mid Break", "color": "#3b82f6", "rgb": (59, 130, 246), "text": "text-blue-400", "border": "border-blue-500/50", "bg": "bg-blue-500/10"},
            {"id": 7, "name": "Drop 2 (Re-Kick)", "color": "#a855f7", "rgb": (168, 85, 247), "text": "text-purple-400", "border": "border-purple-500/50", "bg": "bg-purple-500/10"},
            {"id": 8, "name": "Outro Mix Point", "color": "#ec4899", "rgb": (236, 72, 153), "text": "text-pink-400", "border": "border-pink-500/50", "bg": "bg-pink-500/10"}
        ]

        result = []
        for idx in range(8):
            cfg = cue_configs[idx]
            b_offset = bar_offsets[idx] if idx < len(bar_offsets) else (idx * 16)
            compas = b_offset + 1
            pos_ms = int(downbeat_clean + (b_offset * bar_ms))
            if pos_ms >= dur_clean:
                pos_ms = max(0, dur_clean - int((8 - idx) * 1000))

            sec = pos_ms / 1000.0
            m = int(sec // 60)
            s = sec % 60
            time_str = f"{m:02d}:{s:04.1f}"
            pct = round(pos_ms / dur_clean, 4) if dur_clean > 0 else 0.0

            result.append({
                "id": cfg["id"],
                "bar": compas,
                "bar_str": f"Bar {compas}",
                "name": f"{cfg['name']} (Bar {compas})",
                "short_name": cfg["name"],
                "pos_ms": pos_ms,
                "time": time_str,
                "pct": pct,
                "color": cfg["color"],
                "rgb": cfg["rgb"],
                "text": cfg["text"],
                "border": cfg["border"],
                "bg": cfg["bg"]
            })

        return result

    @staticmethod
    def generar_hot_cues_plantilla_club(duration_ms: int = 300000, bpm: float = 128.0, downbeat_ms: int = 0) -> list:
        """Motor de Auto-Mapping con Plantilla Club Extended (16/32 compases).
        Asigna los 8 Hot Cues con cuantización exacta al BeatGrid:
        Pad 1: Intro / Downbeat (0 compases / Downbeat)
        Pad 2: First Beat / Percussion In (compás 16 o 32)
        Pad 3: Breakdown Principal (bajada melódica antes del clímax)
        Pad 4: Drop Clímax (explosión del tema)
        Pad 5: Loop Rítmico (16 compases sin melodía)
        Pad 6: Loop Rítmico (32 compases para mezcla larga)
        Pad 7: Outro Mix Point (inicio de salida)
        Pad 8: Outro End (cola final)
        """
        try:
            bpm_clean = float(bpm) if bpm and float(bpm) > 20.0 else 128.0
        except Exception:
            bpm_clean = 128.0

        try:
            dur_clean = int(duration_ms) if duration_ms and int(duration_ms) > 1000 else 300000
        except Exception:
            dur_clean = 300000

        try:
            downbeat_clean = max(0, int(downbeat_ms))
        except Exception:
            downbeat_clean = 0

        beat_ms = 60000.0 / bpm_clean
        bar_ms = beat_ms * 4.0
        usable_dur = max(1000, dur_clean - downbeat_clean)
        total_bars = max(8.0, usable_dur / bar_ms)

        if total_bars >= 128:
            bar_offsets = [0, 32, 64, 80, 96, 112, max(116, int(total_bars - 32)), max(124, int(total_bars - 8))]
        elif total_bars >= 64:
            bar_offsets = [0, 16, 32, 40, 48, 56, max(58, int(total_bars - 16)), max(62, int(total_bars - 4))]
        else:
            step = max(1.0, total_bars / 8.0)
            bar_offsets = [int(i * step) for i in range(8)]

        template_configs = [
            {"id": 1, "name": "Intro / Downbeat", "color": "#ef4444", "rgb": (239, 68, 68)},
            {"id": 2, "name": "First Beat (Percussion)", "color": "#f97316", "rgb": (249, 115, 22)},
            {"id": 3, "name": "Breakdown Principal", "color": "#eab308", "rgb": (234, 179, 8)},
            {"id": 4, "name": "Drop (Climax)", "color": "#06b6d4", "rgb": (6, 182, 212)},
            {"id": 5, "name": "Loop Rítmico (16 Compases)", "color": "#22c55e", "rgb": (34, 197, 94)},
            {"id": 6, "name": "Loop Rítmico (32 Compases)", "color": "#3b82f6", "rgb": (59, 130, 246)},
            {"id": 7, "name": "Outro Mix Point", "color": "#a855f7", "rgb": (168, 85, 247)},
            {"id": 8, "name": "Outro End", "color": "#ec4899", "rgb": (236, 72, 153)}
        ]

        result = []
        for idx in range(8):
            cfg = template_configs[idx]
            b_off = bar_offsets[idx] if idx < len(bar_offsets) else (idx * 16)
            compas = b_off + 1
            pos_ms = int(downbeat_clean + (b_off * bar_ms))
            if pos_ms >= dur_clean:
                pos_ms = max(0, dur_clean - int((8 - idx) * 1000))

            sec = pos_ms / 1000.0
            m = int(sec // 60)
            s = sec % 60
            time_str = f"{m:02d}:{s:04.1f}"
            pct = round(pos_ms / dur_clean, 4) if dur_clean > 0 else 0.0

            result.append({
                "id": cfg["id"],
                "bar": compas,
                "bar_str": f"Bar {compas}",
                "name": f"{cfg['name']} (Bar {compas})",
                "short_name": cfg["name"],
                "pos_ms": pos_ms,
                "time": time_str,
                "pct": pct,
                "color": cfg["color"],
                "rgb": cfg["rgb"]
            })

        return result

    @staticmethod
    def generar_serato_markers2(duration_ms: int = 300000, bpm: float = 128.0, cues: list = None, downbeat_ms: int = 0) -> bytes:
        """Construye el bloque binario base64 compatible con Serato Markers2 (Pads 1-8 Numark/Pioneer)."""
        out = bytearray(b"\x01\x01")
        # Color del track en Serato (Cian #06b6d4)
        out.extend(b"COLOR\x00" + struct.pack(">I", 4) + b"\x00\x06\xb6\xd4")
        # BPMLOCK: 0 (desbloqueado)
        out.extend(b"BPMLOCK\x00" + struct.pack(">I", 1) + b"\x00")

        if not cues or len(cues) == 0:
            active_cues = AudioProcessorService.calcular_8_hot_cues_fraseo(
                duration_ms=duration_ms,
                bpm=bpm,
                downbeat_ms=downbeat_ms
            )
        else:
            active_cues = cues

        for i, c in enumerate(active_cues[:8]):
            cid = i # Serato pad ID: 0..7
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

            cname = str(c.get("name", f"Cue {i + 1}")).encode("utf-8") + b"\x00"
            rgb = c.get("rgb")
            if not rgb and isinstance(c.get("color"), str) and c.get("color").startswith("#"):
                try:
                    h = c.get("color").lstrip("#")
                    if len(h) == 6:
                        rgb = tuple(int(h[x:x+2], 16) for x in (0, 2, 4))
                except Exception:
                    pass
            if not rgb:
                rgb = (6, 182, 212)
            elif isinstance(rgb, str) and rgb.startswith("#"):
                try:
                    h = rgb.lstrip("#")
                    if len(h) == 6:
                        rgb = tuple(int(h[x:x+2], 16) for x in (0, 2, 4))
                    else:
                        rgb = (6, 182, 212)
                except Exception:
                    rgb = (6, 182, 212)

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
    def serializar_serato_beatgrid(bpm: float = 128.0, downbeat_ms: float = 0.0) -> bytes:
        """Serializa el bloque binario oficial Serato BeatGrid (GEOB:Serato BeatGrid).
        Estructura estándar Serato DJ Pro:
        - Header (6 bytes): \\x01\\x00 + uint32 BE (conteo de marcadores = 1)
        - Marcador terminal (8 bytes): float32 BE (posición segundos) + float32 BE (BPM)
        - Footer (1 byte): \\x00
        """
        try:
            bpm_val = float(bpm) if bpm and float(bpm) > 20.0 else 128.0
        except Exception:
            bpm_val = 128.0
        try:
            pos_sec = max(0.0, float(downbeat_ms) / 1000.0)
        except Exception:
            pos_sec = 0.0

        header = b"\x01\x00" + struct.pack(">I", 1)
        marker = struct.pack(">ff", pos_sec, bpm_val)
        footer = b"\x00"
        return header + marker + footer

    @staticmethod
    def procesar_caratula_cuadrada(cover_source, max_dim: int = 600) -> bytes:
        """Descarga o abre una carátula, la recorta a proporción 1:1 cuadrada centrada
        y la reescala a max_dim x max_dim en formato JPEG optimizado para hardware DJ."""
        if not cover_source:
            return b""
        try:
            from PIL import Image
            import io
            import base64
            import urllib.request

            img = None
            if isinstance(cover_source, bytes):
                img = Image.open(io.BytesIO(cover_source))
            elif isinstance(cover_source, str):
                cover_str = cover_source.strip()
                if cover_str.startswith("data:image"):
                    b64_data = cover_str.split(",", 1)[-1]
                    raw_bytes = base64.b64decode(b64_data)
                    img = Image.open(io.BytesIO(raw_bytes))
                elif cover_str.startswith("http://") or cover_str.startswith("https://"):
                    req = urllib.request.Request(
                        cover_str,
                        headers={"User-Agent": "Mozilla/5.0 (BeatWave Pro)"}
                    )
                    with urllib.request.urlopen(req, timeout=5) as resp:
                        raw_bytes = resp.read()
                        img = Image.open(io.BytesIO(raw_bytes))
                elif os.path.exists(cover_str):
                    img = Image.open(cover_str)

            if img is None:
                return b""

            if img.mode != "RGB":
                img = img.convert("RGB")

            w, h = img.size
            if w != h:
                min_dim = min(w, h)
                left = (w - min_dim) // 2
                top = (h - min_dim) // 2
                img = img.crop((left, top, left + min_dim, top + min_dim))

            resample_filter = getattr(Image, "Resampling", Image).LANCZOS
            img = img.resize((max_dim, max_dim), resample=resample_filter)

            out_buf = io.BytesIO()
            img.save(out_buf, format="JPEG", quality=92, optimize=True, progressive=False)
            return out_buf.getvalue()
        except Exception as e:
            print(f"[ARTWORK WARN] No se pudo procesar carátula con PIL: {e}")
            if isinstance(cover_source, bytes) and len(cover_source) > 50:
                return cover_source
            elif isinstance(cover_source, str) and os.path.exists(cover_source):
                try:
                    with open(cover_source, "rb") as f:
                        return f.read()
                except Exception:
                    pass
            return b""

    @staticmethod
    def resolver_caratula_local_o_remota(ruta: str, artist: str = "", title: str = "") -> str:
        """Busca carátula de alta resolución en la carpeta local o vía API de iTunes si la pista no tiene carátula."""
        if not ruta:
            return ""
        directorio = os.path.dirname(ruta)
        if directorio and os.path.exists(directorio):
            candidatos = [
                "cover.jpg", "cover.png", "cover.jpeg",
                "folder.jpg", "folder.png", "album.jpg",
                "front.jpg", "front.png"
            ]
            for cand in candidatos:
                c_path = os.path.join(directorio, cand)
                if os.path.exists(c_path):
                    return c_path

        if artist and title and artist != "Desconocido":
            try:
                import urllib.parse
                import urllib.request
                import json
                import ssl
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                q = urllib.parse.quote(f"{artist} {title}")
                url = f"https://itunes.apple.com/search?term={q}&entity=song&limit=1"
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (BeatWave Pro)"})
                with urllib.request.urlopen(req, context=ctx, timeout=4) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    results = data.get("results", [])
                    if results and results[0].get("artworkUrl100"):
                        return results[0]["artworkUrl100"].replace("100x100bb", "600x600bb")
            except Exception as e:
                print(f"[ARTWORK SEARCH WARN] {e}")

        return ""

    @staticmethod
    def escribir_metadatos_pro(ruta: str, meta_track: dict, cover_url: str = None) -> bool:
        """Inyecta metadatos profesionales para DJs (BPM exacto, Camelot TKEY, Comentario Táctico COMM,
        Serato Markers2 Cues, Serato BeatGrid, Carátula 1:1, ISRC, Género) en archivos FLAC, MP3, AIFF, M4A y WAV."""
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
        genre_val = str(meta_track.get("genre") or meta_track.get("mood") or "Tech House").strip()
        subgenre_val = str(meta_track.get("subgenre") or "").strip()
        if subgenre_val and subgenre_val.lower() not in genre_val.lower():
            genre_full = f"{genre_val} / {subgenre_val}"
        else:
            genre_full = genre_val
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

        downbeat_ms = int(float(meta_track.get("first_downbeat_ms") or 0))
        trim_ms = float(meta_track.get("trim_start_ms") or 0.0)
        dance_val = int(meta_track.get("danceability") or meta_track.get("dance") or 85)
        mood_val = str(meta_track.get("mood") or "Peak Time")
        cues_list = meta_track.get("cues") or []

        serato_b64 = AudioProcessorService.generar_serato_markers2(
            duration_ms=dur_ms,
            bpm=bpm_float,
            cues=cues_list,
            downbeat_ms=downbeat_ms
        )
        serato_beatgrid_bin = AudioProcessorService.serializar_serato_beatgrid(
            bpm=bpm_float,
            downbeat_ms=downbeat_ms
        )

        cover_source = cover_url or meta_track.get("cover") or meta_track.get("cover_url") or meta_track.get("image_url")
        if not cover_source:
            cover_source = AudioProcessorService.resolver_caratula_local_o_remota(ruta, artist, title)
        cover_bytes = AudioProcessorService.procesar_caratula_cuadrada(cover_source) if cover_source else b""

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
                audio["GENRE"] = [genre_full]
                if subgenre_val:
                    audio["SUBGENRE"] = [subgenre_val]
                if isrc:
                    audio["ISRC"] = [isrc]
                audio["DANCEABILITY"] = [str(dance_val)]
                audio["MOOD"] = [mood_val]
                if trim_ms > 0:
                    audio["TRIM_START_MS"] = [f"{trim_ms:.1f}"]
                if downbeat_ms > 0:
                    audio["FIRST_DOWNBEAT_MS"] = [f"{downbeat_ms:.1f}"]
                audio["SERATO_MARKERS_V2"] = [serato_b64.decode("ascii")]
                audio["SERATO_BEATGRID"] = [base64.b64encode(serato_beatgrid_bin).decode("ascii")]

                if cover_bytes:
                    try:
                        pic = Picture()
                        pic.type = 3
                        pic.mime = "image/jpeg"
                        pic.desc = "Front Cover"
                        pic.width = 600
                        pic.height = 600
                        pic.depth = 24
                        pic.data = cover_bytes
                        audio.clear_pictures()
                        audio.add_picture(pic)
                    except Exception as p_err:
                        print(f"[ARTWORK WARN] Fallo incrustando carátula FLAC: {p_err}")

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
                id3.add(TCON(encoding=3, text=[genre_full]))
                if subgenre_val:
                    id3.add(TXXX(encoding=3, desc="SUBGENRE", text=[subgenre_val]))
                if isrc:
                    id3.add(TSRC(encoding=3, text=[isrc]))

                id3.add(TXXX(encoding=3, desc="DANCEABILITY", text=[str(dance_val)]))
                id3.add(TXXX(encoding=3, desc="MOOD", text=[mood_val]))

                if trim_ms > 0:
                    id3.add(TXXX(encoding=3, desc="TRIM_START_MS", text=[f"{trim_ms:.1f}"]))
                if downbeat_ms > 0:
                    id3.add(TXXX(encoding=3, desc="FIRST_DOWNBEAT_MS", text=[f"{downbeat_ms:.1f}"]))

                # Inyección GEOB para Serato Markers2 (Cues oficiales)
                id3.add(GEOB(
                    encoding=0,
                    mime="application/octet-stream",
                    desc="Serato Markers2",
                    data=serato_b64
                ))
                # Inyección GEOB para Serato BeatGrid
                id3.add(GEOB(
                    encoding=0,
                    mime="application/octet-stream",
                    desc="Serato BeatGrid",
                    data=serato_beatgrid_bin
                ))
                # Inyección GEOB para Serato Autotags
                autotags_data = b"\x01\x01" + f"{bpm_str}\x000.000\x000.000\x00".encode("ascii")
                id3.add(GEOB(
                    encoding=0,
                    mime="application/octet-stream",
                    desc="Serato Autotags",
                    data=autotags_data
                ))

                if cover_bytes:
                    try:
                        id3.delall("APIC")
                        id3.add(APIC(
                            encoding=3,
                            mime="image/jpeg",
                            type=3,
                            desc="Cover",
                            data=cover_bytes
                        ))
                    except Exception as a_err:
                        print(f"[ARTWORK WARN] Fallo incrustando carátula MP3: {a_err}")

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
                tags.add(TCON(encoding=3, text=[genre_full]))
                if subgenre_val:
                    tags.add(TXXX(encoding=3, desc="SUBGENRE", text=[subgenre_val]))
                tags.add(TXXX(encoding=3, desc="DANCEABILITY", text=[str(dance_val)]))
                tags.add(TXXX(encoding=3, desc="MOOD", text=[mood_val]))
                if trim_ms > 0:
                    tags.add(TXXX(encoding=3, desc="TRIM_START_MS", text=[f"{trim_ms:.1f}"]))
                if downbeat_ms > 0:
                    tags.add(TXXX(encoding=3, desc="FIRST_DOWNBEAT_MS", text=[f"{downbeat_ms:.1f}"]))
                tags.add(GEOB(encoding=0, mime="application/octet-stream", desc="Serato Markers2", data=serato_b64))
                tags.add(GEOB(encoding=0, mime="application/octet-stream", desc="Serato BeatGrid", data=serato_beatgrid_bin))

                if cover_bytes:
                    try:
                        tags.delall("APIC")
                        tags.add(APIC(
                            encoding=3,
                            mime="image/jpeg",
                            type=3,
                            desc="Cover",
                            data=cover_bytes
                        ))
                    except Exception as a_err:
                        print(f"[ARTWORK WARN] Fallo incrustando carátula AIFF: {a_err}")

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
                audio["\xa9gen"] = [genre_full]
                if subgenre_val:
                    audio["----:com.apple.iTunes:SUBGENRE"] = [subgenre_val.encode("utf-8")]
                if key_camelot:
                    audio["----:com.apple.iTunes:initialkey"] = [key_camelot.encode("utf-8")]
                audio["----:com.apple.iTunes:DANCEABILITY"] = [str(dance_val).encode("utf-8")]
                audio["----:com.apple.iTunes:MOOD"] = [mood_val.encode("utf-8")]
                if trim_ms > 0:
                    audio["----:com.apple.iTunes:TRIM_START_MS"] = [f"{trim_ms:.1f}".encode("utf-8")]
                if downbeat_ms > 0:
                    audio["----:com.apple.iTunes:FIRST_DOWNBEAT_MS"] = [f"{downbeat_ms:.1f}".encode("utf-8")]

                if cover_bytes:
                    try:
                        audio["covr"] = [MP4Cover(cover_bytes, imageformat=MP4Cover.FORMAT_JPEG)]
                    except Exception as c_err:
                        print(f"[ARTWORK WARN] Fallo incrustando carátula MP4: {c_err}")

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
