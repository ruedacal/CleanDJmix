import os
import re
import struct
import base64
from mutagen import File as MutagenFile
from mutagen.flac import FLAC, FLACNoHeaderError, Picture
from mutagen.mp3 import MP3
from mutagen.id3 import ID3, TIT1, TIT2, TPE1, TALB, TBPM, TKEY, COMM, TCON, TSRC, GEOB, TXXX, APIC, TPE4, TCOM, TYER, TPUB, ID3NoHeaderError
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
    def detectar_formato_audio(ruta: str) -> str:
        """Determina de forma ultrarrápida y precisa el formato real del contenedor de audio
        analizando sus magic bytes iniciales en lugar de fiarse a ciegas de la extensión de archivo.
        Resuelve archivos con extensión alterada (ej. MP3 o M4A guardados como .flac).
        Retorna: 'flac', 'mp3', 'm4a', 'aiff', 'wav', 'ogg' o la extensión normalizada."""
        if not ruta or not os.path.exists(ruta):
            return ""
        try:
            with open(ruta, "rb") as fp:
                head = fp.read(128)
            
            # 1. FLAC nativo canónico
            if head.startswith(b"fLaC"):
                return "flac"
            
            # 2. Cabecera ID3v2 (puede ser MP3 legítimo o un stream FLAC con tag ID3 previo)
            if head.startswith(b"ID3"):
                if len(head) >= 10:
                    tag_size = (head[6] << 21) | (head[7] << 14) | (head[8] << 7) | head[9]
                    total_id3 = 10 + tag_size
                    try:
                        with open(ruta, "rb") as fp2:
                            fp2.seek(total_id3)
                            if fp2.read(4) == b"fLaC":
                                return "flac"
                    except Exception:
                        pass
                return "mp3"
            
            # 3. Frames de sincronización MPEG ADTS / MP3 sin ID3 (0xFF 0xEx / 0xFx)
            if len(head) >= 2 and head[0] == 0xFF and (head[1] & 0xE0) == 0xE0:
                return "mp3"
            
            # 4. Contenedores MP4 / M4A / AAC (ftyp o moov atom en los primeros 32 bytes)
            if b"ftyp" in head[:32] or b"moov" in head[:32]:
                return "m4a"
            
            # 5. AIFF / AIF (FORM + AIFF o AIFC)
            if head.startswith(b"FORM") and (b"AIFF" in head[:16] or b"AIFC" in head[:16]):
                return "aiff"
            
            # 6. WAV (RIFF + WAVE)
            if head.startswith(b"RIFF") and b"WAVE" in head[:16]:
                return "wav"
            
            # 7. Ogg Vorbis / Opus (OggS)
            if head.startswith(b"OggS"):
                return "ogg"
        except Exception:
            pass

        # Fallback a la extensión de archivo normalizada
        ext = os.path.splitext(ruta)[1].lower().replace(".", "")
        if ext in ("aif", "aiff"):
            return "aiff"
        if ext in ("mp4", "m4a", "aac", "alac"):
            return "m4a"
        return ext

    @staticmethod
    def _cargar_audio_head_resiliente(ruta: str, max_sec: float = 12.0) -> tuple:
        """Carga los primeros segundos de audio de forma resiliente con fallback multi-tier.
        Soporta FLAC, WAV, AIFF, MP3 (incluso con cabeceras ID3 gigantes > 64KB), M4A, AAC, OGG."""
        if not ruta or not os.path.exists(ruta) or os.path.getsize(ruta) < 1024:
            return None, 44100
        
        # 1. Intentar soundfile (ultrarrápido C-level)
        try:
            import soundfile as sf
            import numpy as np
            data, sr = sf.read(ruta, frames=int(max_sec * 44100), dtype="float32")
            if data is not None and len(data) > 0:
                mono = np.mean(data, axis=1) if data.ndim > 1 else data
                return mono, sr
        except Exception:
            pass

        # 2. Fallback a librosa (maneja MP3 con tags grandes, m4a, aac vía audioread/ffmpeg)
        try:
            import librosa
            mono, sr = librosa.load(ruta, sr=44100, mono=True, duration=max_sec)
            if mono is not None and len(mono) > 0:
                return mono, sr
        except Exception:
            pass

        # 3. Fallback a pydub / ffmpeg
        try:
            from pydub import AudioSegment
            import numpy as np
            seg = AudioSegment.from_file(ruta)[:int(max_sec * 1000)]
            if len(seg) > 0:
                samples = np.array(seg.get_array_of_samples(), dtype=np.float32)
                if seg.channels > 1:
                    samples = samples.reshape((-1, seg.channels)).mean(axis=1)
                max_val = float(1 << (seg.sample_width * 8 - 1))
                mono = samples / max_val
                return mono, seg.frame_rate
        except Exception:
            pass

        return None, 44100

    @staticmethod
    def detectar_trim_y_downbeat(ruta: str) -> tuple:
        """Calcula de forma rigurosa y en dos fases consecutivas:
        1. Recorte bidireccional de silencio muerto (Zero-Crossing Auto-Trim a -48 dBFS en Cabecera y Cola).
        2. Fijación matemática del Beatgrid 1.0.0 anclado al primer golpe de bombo real (downbeat >= trim_start).
        Retorna: (trim_start_ms, trim_end_ms, first_downbeat_ms)"""
        if not ruta or not os.path.exists(ruta) or os.path.getsize(ruta) < 1024:
            return 0.0, 0.0, 0.0
        try:
            import soundfile as sf
            import numpy as np

            # 1. Inspección de metadatos de audio con soundfile C-level
            info = sf.info(ruta)
            sr = info.samplerate
            total_frames = info.frames
            dur_total_ms = round((total_frames / sr) * 1000.0, 1)

            # --- CABECERA (HEAD): Cargar los primeros 20 segundos para cubrir intros atmosféricas ---
            mono_head, sr_head = AudioProcessorService._cargar_audio_head_resiliente(ruta, max_sec=20.0)
            if mono_head is None or len(mono_head) == 0:
                return 0.0, dur_total_ms, 0.0

            # FASE 1A: Zero-Crossing Silence Trim en Cabecera
            hop_silence = max(1, int(sr_head * 0.005))  # bloques de 5ms
            num_blocks = len(mono_head) // hop_silence
            trim_start_ms = 0.0
            downbeat_ms = 0.0

            if num_blocks > 0:
                sliced = mono_head[:num_blocks * hop_silence].reshape((num_blocks, hop_silence))
                block_rms = np.sqrt(np.mean(sliced ** 2, axis=1))

                # Umbral Auto-Cue estándar DJ (-48 dBFS ~ 0.00398) con fallbacks graduados
                audible_blocks = np.where(block_rms > 0.00398)[0]
                if len(audible_blocks) == 0:
                    audible_blocks = np.where(block_rms > 0.00200)[0]  # -54 dBFS
                if len(audible_blocks) == 0:
                    audible_blocks = np.where(block_rms > 0.00100)[0]  # -60 dBFS

                if len(audible_blocks) > 0:
                    first_block = audible_blocks[0]
                    sample_candidate = first_block * hop_silence

                    # Búsqueda retroactiva del cruce por cero exacto para garantizar 0 DC offset y 0 pop
                    search_start = max(0, sample_candidate - int(sr_head * 0.025))
                    sub = mono_head[search_start:sample_candidate + hop_silence]
                    signs = np.signbit(sub)
                    diffs = np.where(np.diff(signs))[0]
                    if len(diffs) > 0:
                        zero_cross_idx = search_start + int(diffs[-1])
                    else:
                        zero_cross_idx = sample_candidate

                    trim_start_ms = round(float(zero_cross_idx) / sr_head * 1000.0, 1)

                    # FASE 1B: Detección estricta del primer golpe de bombo real (Beatgrid 1.0.0 & Hot Cue 1)
                    # Aísla la pegada física del bombo (40 - 115 Hz) descartando pads, sweeps, risers y charles
                    max_search_samples = min(len(mono_head), zero_cross_idx + int(sr_head * 18.0))
                    sub_audio = mono_head[zero_cross_idx:max_search_samples]

                    if len(sub_audio) >= int(sr_head * 0.1):
                        try:
                            from scipy.signal import butter, filtfilt
                            nyq = 0.5 * sr_head
                            low_f = max(20.0, min(40.0, nyq * 0.1))
                            high_f = min(115.0, nyq * 0.45)
                            b, a = butter(4, [low_f / nyq, high_f / nyq], btype='bandpass')
                            sub_kick = filtfilt(b, a, sub_audio)
                        except Exception:
                            sub_kick = sub_audio

                        frame_len = int(sr_head * 0.025)  # 25ms
                        hop_len = int(sr_head * 0.003)    # 3ms

                        if len(sub_kick) > frame_len:
                            num_frames = (len(sub_kick) - frame_len) // hop_len
                            frames = np.lib.stride_tricks.as_strided(
                                sub_kick,
                                shape=(num_frames, frame_len),
                                strides=(sub_kick.strides[0] * hop_len, sub_kick.strides[0])
                            )
                            energies = np.sqrt(np.mean(frames ** 2, axis=1))
                            energy_diff = np.maximum(0, np.diff(energies))

                            max_diff = float(np.max(energy_diff)) if len(energy_diff) > 0 else 0.0
                            if max_diff > 0.004:
                                # Umbral estricto para bombo: al menos 50% de la máxima aceleración transitoria subgrave
                                peaks = np.where(energy_diff > (max_diff * 0.50))[0]
                                if len(peaks) > 0:
                                    first_peak = int(peaks[0])
                                    peak_sample = zero_cross_idx + (first_peak * hop_len)
                                    local_window = mono_head[max(0, peak_sample - hop_len):min(len(mono_head), peak_sample + frame_len)]
                                    local_max_idx = int(np.argmax(np.abs(local_window))) if len(local_window) > 0 else 0
                                    final_sample = max(0, peak_sample - hop_len + local_max_idx)
                                    downbeat_ms = round(float(final_sample) / sr_head * 1000.0, 1)
                                else:
                                    downbeat_ms = trim_start_ms
                            else:
                                downbeat_ms = trim_start_ms
                        else:
                            downbeat_ms = trim_start_ms
                    else:
                        downbeat_ms = trim_start_ms
                else:
                    trim_start_ms = 0.0
                    downbeat_ms = 0.0

            if downbeat_ms < trim_start_ms:
                downbeat_ms = trim_start_ms

            # --- COLA (TAIL): Detección de Silencio Final / Outro Fade-Out ---
            trim_end_ms = dur_total_ms
            tail_sec = min(25.0, dur_total_ms / 1000.0 * 0.5)
            tail_frames = int(tail_sec * sr)
            if tail_frames > 0 and total_frames > tail_frames:
                try:
                    start_tail_frame = total_frames - tail_frames
                    tail_data, _ = sf.read(ruta, start=start_tail_frame, stop=total_frames, dtype='float32')
                    mono_tail = np.mean(tail_data, axis=1) if tail_data.ndim > 1 else tail_data
                    
                    hop_tail = max(1, int(sr * 0.01)) # 10ms
                    num_tail_blocks = len(mono_tail) // hop_tail
                    if num_tail_blocks > 0:
                        tail_blocks = mono_tail[:num_tail_blocks * hop_tail].reshape((num_tail_blocks, hop_tail))
                        tail_rms = np.sqrt(np.mean(tail_blocks ** 2, axis=1))
                        # Umbral de cola: corte a -54 dBFS (~0.0020) o -60 dBFS
                        audible_tail = np.where(tail_rms > 0.0020)[0]
                        if len(audible_tail) == 0:
                            audible_tail = np.where(tail_rms > 0.0010)[0]
                        if len(audible_tail) > 0:
                            last_block = audible_tail[-1]
                            rel_sample = (last_block + 1) * hop_tail
                            abs_sample = start_tail_frame + rel_sample
                            trim_end_ms = min(dur_total_ms, round(abs_sample / sr * 1000.0, 1))
                except Exception:
                    trim_end_ms = dur_total_ms

            return trim_start_ms, trim_end_ms, downbeat_ms
        except Exception:
            return 0.0, 0.0, 0.0

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

        real_fmt = AudioProcessorService.detectar_formato_audio(ruta)

        # Intento de lectura inteligente basado en el contenedor real del archivo
        try:
            if real_fmt == "flac":
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
                except Exception:
                    real_fmt = "mp3"  # Fallback a inspección ID3/MP3 si falla FLAC

            if real_fmt == "mp3":
                try:
                    mp = MP3(ruta)
                    if mp and mp.info:
                        duration_sec = int(getattr(mp.info, "length", 0))
                except Exception:
                    pass
                try:
                    id3_tags = ID3(ruta)
                    t_frame = id3_tags.get("TXXX:TRIM_START_MS")
                    d_frame = id3_tags.get("TXXX:FIRST_DOWNBEAT_MS")
                    dance_frame = id3_tags.get("TXXX:DANCEABILITY")
                    mood_frame = id3_tags.get("TXXX:MOOD")
                    tcon_frame = id3_tags.get("TCON")
                    subg_frame = id3_tags.get("TXXX:SUBGENRE")
                    tit2 = id3_tags.get("TIT2")
                    tpe1 = id3_tags.get("TPE1")
                    tbpm = id3_tags.get("TBPM")
                    tkey = id3_tags.get("TKEY") or id3_tags.get("TXXX:INITIALKEY") or id3_tags.get("TXXX:KEY")
                    if tit2 and tit2.text:
                        title = str(tit2.text[0])
                    if tpe1 and tpe1.text:
                        artist = str(tpe1.text[0])
                    if tbpm and tbpm.text:
                        try:
                            bpm = float(str(tbpm.text[0]).replace(",", "."))
                        except Exception:
                            pass
                    if tkey and tkey.text:
                        key = AudioProcessorService.normalizar_key(str(tkey.text[0]))
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

            elif real_fmt in ("m4a", "aac", "mp4"):
                try:
                    mp4 = MP4(ruta)
                    if mp4.info:
                        duration_sec = int(getattr(mp4.info, "length", 0))
                    title = str(mp4.get("\xa9nam", [""])[0])
                    artist = str(mp4.get("\xa9ART", [""])[0])
                    bpm_raw = mp4.get("tmpo", [""])[0]
                    if bpm_raw:
                        try:
                            bpm = float(bpm_raw)
                        except Exception:
                            pass
                    key_raw = mp4.get("----:com.apple.iTunes:initialkey", [b""])[0]
                    if key_raw:
                        key = AudioProcessorService.normalizar_key(key_raw.decode("utf-8", "ignore") if isinstance(key_raw, bytes) else str(key_raw))
                    genre_raw = mp4.get("\xa9gen", [""])[0]
                    if genre_raw:
                        genre_val = str(genre_raw)
                    sub_raw = mp4.get("----:com.apple.iTunes:SUBGENRE", [b""])[0]
                    if sub_raw:
                        subgenre_val = sub_raw.decode("utf-8", "ignore") if isinstance(sub_raw, bytes) else str(sub_raw)
                except Exception:
                    pass

            elif real_fmt in ("aiff", "aif"):
                try:
                    aif = AIFF(ruta)
                    if aif.info:
                        duration_sec = int(getattr(aif.info, "length", 0))
                    if aif.tags:
                        tit2 = aif.tags.get("TIT2")
                        tpe1 = aif.tags.get("TPE1")
                        tbpm = aif.tags.get("TBPM")
                        tkey = aif.tags.get("TKEY")
                        if tit2 and tit2.text:
                            title = str(tit2.text[0])
                        if tpe1 and tpe1.text:
                            artist = str(tpe1.text[0])
                        if tbpm and tbpm.text:
                            try:
                                bpm = float(str(tbpm.text[0]).replace(",", "."))
                            except Exception:
                                pass
                        if tkey and tkey.text:
                            key = AudioProcessorService.normalizar_key(str(tkey.text[0]))
                except Exception:
                    pass

            # Fallback genérico si no se extrajo información
            if not title or duration_sec <= 0:
                m = MutagenFile(ruta, easy=True)
                if m:
                    if duration_sec <= 0 and m.info:
                        duration_sec = int(getattr(m.info, "length", 0))
                    if not title:
                        title = str(m.get("title", [""])[0])
                    if not artist:
                        artist = str(m.get("artist", [""])[0])
                    if bpm <= 0:
                        raw_bpm = str(m.get("bpm", [""])[0]).replace(",", ".")
                        if raw_bpm:
                            try:
                                bpm = float(raw_bpm)
                            except ValueError:
                                pass
                    if not key:
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
            try:
                import librosa
                y, sr = librosa.load(ruta, sr=22050, offset=25.0, duration=30.0)
                if len(y) > 0:
                    tempo, _ = librosa.beat.beat_track(y=y, sr=sr, start_bpm=128.0)
                    t_val = float(tempo[0] if hasattr(tempo, '__len__') else tempo)
                    if t_val > 0:
                        bpm = round(t_val, 2)
            except Exception:
                pass
            if bpm <= 0.0:
                bpm = 128.0

        if not key:
            pool = ["8A", "9A", "10A", "11A", "12A", "5A", "6A", "7A", "8B", "9B"]
            try:
                key = pool[os.path.getsize(ruta) % len(pool)]
            except Exception:
                key = "8A"

        trim_end_ms = 0.0
        if trim_start_ms <= 0.0 or first_downbeat_ms <= 0.0:
            det_res = AudioProcessorService.detectar_trim_y_downbeat(ruta)
            if len(det_res) == 3:
                det_trim, det_end, det_down = det_res
            else:
                det_trim, det_down = det_res
                det_end = float(duration_sec * 1000)
            if trim_start_ms <= 0.0:
                trim_start_ms = det_trim
            if first_downbeat_ms <= 0.0:
                first_downbeat_ms = det_down
            trim_end_ms = det_end
        else:
            trim_end_ms = float(duration_sec * 1000)

        # El Downbeat siempre debe ser >= trim_start_ms
        if first_downbeat_ms < trim_start_ms:
            first_downbeat_ms = trim_start_ms

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
            downbeat_ms=int(first_downbeat_ms),
            ruta=ruta,
            trim_start_ms=int(trim_start_ms),
            trim_end_ms=int(trim_end_ms)
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
            "trim_end_ms": trim_end_ms,
            "first_downbeat_ms": first_downbeat_ms,
            "cues": cues
        }

    @staticmethod
    def calcular_8_hot_cues_fraseo(duration_ms: int = 300000, bpm: float = 128.0, downbeat_ms: int = 0, ruta: str = None, trim_start_ms: int = 0, trim_end_ms: int = 0) -> list:
        """Calcula los 8 Hot Cues estándar (Pads Numark NV2 / Pioneer DJ) sincronizados
        al Beatgrid 1.0.0. Si 'ruta' existe, aplica análisis acústico de subgraves y transitorios
        (Enfoque 4 + 1) para ubicar los Drops y Breaks reales en lugar de meros porcentajes."""
        if ruta and os.path.exists(ruta):
            try:
                cues_acusticos = AudioProcessorService.calcular_8_hot_cues_acusticos(
                    ruta=ruta,
                    duration_ms=duration_ms,
                    bpm=bpm,
                    downbeat_ms=downbeat_ms,
                    trim_start_ms=trim_start_ms,
                    trim_end_ms=trim_end_ms
                )
                if cues_acusticos and len(cues_acusticos) == 8:
                    return cues_acusticos
            except Exception as e_acust:
                print(f"[HOT CUES DSP WARN] Fallback a fraseo estándar: {e_acust}")

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
        total_bars = max(8, int(usable_dur / bar_ms))

        o1 = 0
        if total_bars >= 112:
            o2 = 16
            o3 = 32
            o4 = max(o3 + 8, int((total_bars * 0.36) / 8) * 8)
            o5 = max(o4 + 8, int((total_bars * 0.50) / 8) * 8)
            o6 = max(o5 + 8, int((total_bars * 0.68) / 8) * 8)
            o7 = max(o6 + 8, int((total_bars * 0.82) / 8) * 8)
            o8 = max(o7 + 4, int(max(0, total_bars - 16) / 4) * 4)
        elif total_bars >= 64:
            o2 = 8
            o3 = 16
            o4 = max(o3 + 4, int((total_bars * 0.35) / 4) * 4)
            o5 = max(o4 + 4, int((total_bars * 0.50) / 4) * 4)
            o6 = max(o5 + 4, int((total_bars * 0.68) / 4) * 4)
            o7 = max(o6 + 4, int((total_bars * 0.82) / 4) * 4)
            o8 = max(o7 + 4, int(max(0, total_bars - 8) / 4) * 4)
        else:
            step = max(1, total_bars // 8)
            o2, o3, o4, o5, o6, o7, o8 = [min(total_bars - (8 - i), i * step) for i in range(1, 8)]

        bar_offsets = [o1, o2, o3, o4, o5, o6, o7, o8]
        for i in range(1, 8):
            if bar_offsets[i] <= bar_offsets[i - 1]:
                bar_offsets[i] = bar_offsets[i - 1] + 1
            if bar_offsets[i] >= total_bars:
                bar_offsets[i] = max(bar_offsets[i - 1] + 1, total_bars - (8 - i))

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
    def calcular_8_hot_cues_acusticos(ruta: str, duration_ms: int = 300000, bpm: float = 128.0, downbeat_ms: int = 0, trim_start_ms: int = 0, trim_end_ms: int = 0) -> list:
        """Algoritmo acústico híbrido (Sub-Bass Transients Enfoque 4 + Fraseo Cuantizado Enfoque 1):
        1. Filtra la señal subgrave (< 150 Hz) y calcula envolventes RMS compás a compás.
        2. Detecta caídas sostenidas de graves (Breakdowns) e incrementos explosivos (Drops: Delta Low > 20%).
        3. Cuantiza cada marcador al límite estricto de frase musical (16 o 32 compases) anclado al Beatgrid 1.0.0."""
        import soundfile as sf
        import numpy as np
        import scipy.signal as signal

        bpm_clean = float(bpm) if bpm and float(bpm) > 20.0 else 128.0
        dur_clean = int(duration_ms) if duration_ms and int(duration_ms) > 1000 else 300000
        downbeat_clean = max(0, int(downbeat_ms))

        # Lectura rápida decodificada a mono float32
        data, sr_in = sf.read(ruta, dtype='float32')
        mono = np.mean(data, axis=1) if data.ndim > 1 else data

        # Submuestreo a ~12 kHz para ejecución DSP en < 150ms
        decimate = max(1, sr_in // 12000)
        sr_sub = sr_in // decimate
        mono_sub = mono[::decimate]

        # Filtro Butterworth paso bajo a 150 Hz para aislar la pegada del bombo y subgrave
        sos = signal.butter(2, 150.0 / (sr_sub / 2.0), btype='low', output='sos')
        low_mono = signal.sosfilt(sos, mono_sub)

        beat_ms = 60000.0 / bpm_clean
        bar_ms = beat_ms * 4.0
        bar_samples = int(sr_sub * (bar_ms / 1000.0))
        if bar_samples <= 0:
            bar_samples = int(sr_sub * 2.0)

        # Usar la duración neta entre downbeat y trim_end
        end_ms = trim_end_ms if (trim_end_ms and trim_end_ms > downbeat_clean) else dur_clean
        total_bars = max(8, int((end_ms - downbeat_clean) / bar_ms))
        num_bars_audio = min(total_bars, len(mono_sub) // bar_samples)

        rms_total = np.zeros(num_bars_audio)
        rms_sub = np.zeros(num_bars_audio)
        for b in range(num_bars_audio):
            s = b * bar_samples
            e = s + bar_samples
            rms_total[b] = np.sqrt(np.mean(mono_sub[s:e]**2))
            rms_sub[b] = np.sqrt(np.mean(low_mono[s:e]**2))

        # Gradiente diferencial de subgraves respecto a los 4 compases precedentes
        delta_low = np.zeros(num_bars_audio)
        for i in range(2, num_bars_audio):
            prev_low = np.mean(rms_sub[max(0, i-4):i])
            delta_low[i] = rms_sub[i] - prev_low

        # 1. Cue 1: Downbeat 1.0.0 (Primer beat real)
        o1 = 0

        # 2. Cue 2: Hi-Hats In / Groove In (Compás 17 o 33)
        # Buscar el primer salto significativo en energía de frecuencias medias/altas en los primeros compases
        o2 = 16 if total_bars >= 32 else 8
        if total_bars >= 48 and num_bars_audio >= 33:
            # Si el compás 16 es todavía muy calmo y en el 32 entra percusión completa
            if rms_total[32] > rms_total[16] * 1.25:
                o2 = 32

        # 3. Cue 3: Bassline In / Transición Intro (Compás 33 o 49)
        o3 = max(o2 + 8, 32 if total_bars >= 64 else 16)
        if total_bars >= 80 and o2 == 32:
            o3 = 48

        # 4 & 5. Drop 1 (Clímax) y Main Break:
        # Buscar en la ventana 25% a 65% de la pista el punto de mayor subidón de subgraves (delta_low)
        drop1_min_bar = max(o3 + 8, int(total_bars * 0.25))
        drop1_max_bar = min(num_bars_audio - 16, int(total_bars * 0.65))

        best_drop1_bar = int(total_bars * 0.40)
        best_drop1_score = -999.0
        for b in range(drop1_min_bar, max(drop1_min_bar + 1, drop1_max_bar)):
            # Puntuación combinada: salto de subgraves + nivel absoluto
            score = delta_low[b] * 0.7 + rms_sub[b] * 0.3
            if score > best_drop1_score:
                best_drop1_score = score
                best_drop1_bar = b

        # Cuantizar Drop 1 a límite de frase musical (múltiplos de 8 compases)
        quant_drop1_bar = int(round(best_drop1_bar / 8.0)) * 8
        if quant_drop1_bar <= o3:
            quant_drop1_bar = o3 + 8
        o5 = min(total_bars - 16, quant_drop1_bar) # Cue 5: Drop 1

        # Cue 4: Main Break (Inicio del parón o subidón que precede al Drop 1, típicamente 8 o 16 compases antes)
        # Buscar retroactivamente dónde cayó el subgrave
        break_candidate = max(o3, o5 - 16)
        for b in range(max(o3, o5 - 24), o5):
            if rms_sub[b] < np.mean(rms_sub) * 0.6:
                break_candidate = int(round(b / 8.0)) * 8
                break
        o4 = max(o3 + 4, min(o5 - 4, break_candidate))

        # 6 & 7. Drop 2 (Re-Kick) y Mid Break:
        # Buscar en la ventana 60% a 85% de la pista
        drop2_min_bar = max(o5 + 16, int(total_bars * 0.60))
        drop2_max_bar = min(num_bars_audio - 8, int(total_bars * 0.88))

        best_drop2_bar = int(total_bars * 0.75)
        best_drop2_score = -999.0
        for b in range(drop2_min_bar, max(drop2_min_bar + 1, drop2_max_bar)):
            score = delta_low[b] * 0.7 + rms_sub[b] * 0.3
            if score > best_drop2_score:
                best_drop2_score = score
                best_drop2_bar = b

        quant_drop2_bar = int(round(best_drop2_bar / 8.0)) * 8
        if quant_drop2_bar <= o5 + 8:
            quant_drop2_bar = o5 + 16
        o7 = min(total_bars - 8, quant_drop2_bar) # Cue 7: Drop 2

        # Cue 6: Mid Break (Parón entre Drop 1 y Drop 2)
        mid_break_cand = max(o5 + 8, o7 - 16)
        for b in range(o5 + 8, o7):
            if rms_sub[b] < np.mean(rms_sub) * 0.65:
                mid_break_cand = int(round(b / 8.0)) * 8
                break
        o6 = max(o5 + 4, min(o7 - 4, mid_break_cand))

        # 8. Cue 8: Outro Mix Point (32 o 16 compases antes del fin utilizable trim_end)
        if total_bars >= 112:
            o8 = max(o7 + 8, int((total_bars - 16) / 8) * 8)
        else:
            o8 = max(o7 + 4, total_bars - 8)

        bar_offsets = [o1, o2, o3, o4, o5, o6, o7, o8]
        # Garantía matemática de orden estrictamente ascendente y encaje en límites
        for i in range(1, 8):
            if bar_offsets[i] <= bar_offsets[i - 1]:
                bar_offsets[i] = bar_offsets[i - 1] + 1
            if bar_offsets[i] >= total_bars:
                bar_offsets[i] = max(bar_offsets[i - 1] + 1, total_bars - (8 - i))

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
        total_bars = max(8, int(usable_dur / bar_ms))

        o1 = 0
        if total_bars >= 112:
            o2 = 16
            o3 = 32
            o4 = max(o3 + 8, int((total_bars * 0.36) / 8) * 8)
            o5 = max(o4 + 8, int((total_bars * 0.50) / 8) * 8)
            o6 = max(o5 + 8, int((total_bars * 0.68) / 8) * 8)
            o7 = max(o6 + 8, int((total_bars * 0.82) / 8) * 8)
            o8 = max(o7 + 4, int(max(0, total_bars - 16) / 4) * 4)
        elif total_bars >= 64:
            o2 = 8
            o3 = 16
            o4 = max(o3 + 4, int((total_bars * 0.35) / 4) * 4)
            o5 = max(o4 + 4, int((total_bars * 0.50) / 4) * 4)
            o6 = max(o5 + 4, int((total_bars * 0.68) / 4) * 4)
            o7 = max(o6 + 4, int((total_bars * 0.82) / 4) * 4)
            o8 = max(o7 + 4, int(max(0, total_bars - 8) / 4) * 4)
        else:
            step = max(1, total_bars // 8)
            o2, o3, o4, o5, o6, o7, o8 = [min(total_bars - (8 - i), i * step) for i in range(1, 8)]

        bar_offsets = [o1, o2, o3, o4, o5, o6, o7, o8]
        for i in range(1, 8):
            if bar_offsets[i] <= bar_offsets[i - 1]:
                bar_offsets[i] = bar_offsets[i - 1] + 1
            if bar_offsets[i] >= total_bars:
                bar_offsets[i] = max(bar_offsets[i - 1] + 1, total_bars - (8 - i))

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
        """Construye el bloque binario base64 compatible con Serato Markers2 (Pads 1-8 Numark/Pioneer).
        Estructura oficial:
        - Cabecera binaria (2 bytes): \\x01\\x01
        - Bloque COLOR (RGB cian oficial #06b6d4)
        - Bloque BPMLOCK (1 byte = 0 desbloqueado)
        - Bloques CUE (13 bytes base + nombre con terminación null):
            Offset 00: \\x00 (padding)
            Offset 01: cid (uint8, 0..7)
            Offset 02..05: pos_ms (uint32 BE)
            Offset 06: \\x00
            Offset 07..09: RGB (3 bytes)
            Offset 10..11: \\x00\\x00 (padding)
            Offset 12+: nombre UTF-8 terminado en \\x00
        - Cierre (1 byte): \\x00
        """
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

            # Estructura binaria canónica CUE Serato Markers2 (Offset 00: 0x00, Offset 01: cid, Offset 02..05: pos_ms BE)
            cdata = bytearray()
            cdata.append(0x00) # Offset 00
            cdata.append(cid & 0xFF) # Offset 01: Cue Index
            cdata.extend(struct.pack(">I", max(0, pos_ms))) # Offset 02..05: Posición ms (uint32 BE)
            cdata.append(0x00) # Offset 06
            cdata.extend(bytes([rgb[0], rgb[1], rgb[2]])) # Offset 07..09: RGB
            cdata.extend(b"\x00\x00") # Offset 10..11: Padding
            cdata.extend(cname) # Offset 12: Nombre UTF-8 null-terminated

            out.extend(b"CUE\x00" + struct.pack(">I", len(cdata)) + cdata)

        # Cierre canónico Serato Markers2: un byte null (0x00)
        out.append(0x00)
        return base64.b64encode(bytes(out))

    @staticmethod
    def generar_serato_markers_v1(cues: list = None, duration_ms: int = 300000) -> bytes:
        """Construye el bloque binario oficial compatible con Serato Markers_ (Legacy v1, 14 entradas).
        Permite compatibilidad total con versiones antiguas de Serato DJ / Scratch Live."""
        out = bytearray()
        out.extend(b"\x02\x05") # Magic header
        out.extend(struct.pack(">I", 14)) # 14 entries (5 cues + 9 loops)

        def to_serato32(val: int) -> bytes:
            a = (val >> 16) & 0xFF
            b = (val >> 8) & 0xFF
            c = val & 0xFF
            z = c & 0x7F
            y = ((c >> 7) | (b << 1)) & 0x7F
            x = ((b >> 6) | (a << 2)) & 0x7F
            w = (a >> 5) & 0x7F
            return bytes([w, x, y, z])

        active_cues = cues or []
        for i in range(5):
            if i < len(active_cues) and active_cues[i]:
                c = active_cues[i]
                pos_ms = int(c.get("pos_ms", 0))
                rgb = c.get("rgb") or (6, 182, 212)
                if isinstance(rgb, str) and rgb.startswith("#"):
                    try:
                        h = rgb.lstrip("#")
                        rgb = tuple(int(h[x:x+2], 16) for x in (0, 2, 4))
                    except Exception:
                        rgb = (6, 182, 212)
                rgb_int = (rgb[0] << 16) | (rgb[1] << 8) | rgb[2]
                entry = bytearray()
                entry.append(0x00) # Start set: True (0x00)
                entry.extend(to_serato32(pos_ms)) # Start pos ms (4 bytes serato32)
                entry.append(0x7F) # End set: False
                entry.extend(b"\x7F\x7F\x7F\x7F") # End pos: None
                entry.extend(b"\x00\x7F\x7F\x7F\x7F\x7F") # 6 bytes
                entry.extend(to_serato32(rgb_int)) # Color serato32
                entry.append(0x01) # Type: Cue (0x01)
                entry.append(0x00) # Locked: False
                out.extend(entry)
            else:
                entry = bytearray(b"\x7F" * 22)
                entry[10] = 0x00
                entry[16:20] = b"\x00\x00\x00\x00"
                entry[20] = 0x01
                entry[21] = 0x00
                out.extend(entry)

        # 9 Loops vacíos
        for _ in range(9):
            entry = bytearray(b"\x7F" * 22)
            entry[10] = 0x00
            entry[16:20] = b"\x00\x00\x00\x00"
            entry[20] = 0x03 # Type Loop
            entry[21] = 0x00
            out.extend(entry)

        out.extend(b"\x07\x7F\x7F\x7F") # Footer
        return bytes(out)

    @staticmethod
    def empaquetar_geob_serato_markers2(serato_b64: bytes) -> bytes:
        """Envuelve la carga base64 en la cabecera canónica de Serato Markers2 (\\x01\\x01 + base64 con saltos cada 72 bytes)
        y rellena con null bytes hasta alcanzar el mínimo canónico de 470 bytes requerido por Serato DJ Pro."""
        b64_str = serato_b64.decode("ascii") if isinstance(serato_b64, bytes) else str(serato_b64)
        # Inserción de salto de línea \n cada 72 caracteres según especificación oficial de Serato
        b64_lines = "\n".join(b64_str[i:i+72] for i in range(0, len(b64_str), 72))
        geob_data = b"\x01\x01" + b64_lines.encode("ascii")
        if len(geob_data) < 470:
            geob_data = geob_data.ljust(470, b"\x00")
        return geob_data

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
            nearest_int = round(bpm_val)
            if abs(bpm_val - nearest_int) <= 0.08:
                bpm_val = float(nearest_int)
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
    def tiene_caratula(ruta: str) -> bool:
        """Determina de forma ultrarrápida si el archivo contiene carátula incrustada o en su carpeta."""
        if not ruta or not os.path.exists(ruta):
            return False
        real_fmt = AudioProcessorService.detectar_formato_audio(ruta)
        try:
            if real_fmt == "flac":
                try:
                    f = FLAC(ruta)
                    if f.pictures and len(f.pictures) > 0:
                        return True
                except Exception:
                    pass
            elif real_fmt in ("mp3", "aiff", "aif", "wav"):
                try:
                    id3 = ID3(ruta)
                    if id3.getall("APIC"):
                        return True
                except Exception:
                    pass
            elif real_fmt in ("m4a", "aac", "mp4"):
                try:
                    m = MP4(ruta)
                    if m.tags and "covr" in m.tags and m.tags["covr"]:
                        return True
                except Exception:
                    pass
            else:
                m = MutagenFile(ruta)
                if m:
                    if hasattr(m, "pictures") and m.pictures:
                        return True
                    if hasattr(m, "tags") and m.tags:
                        for tag in m.tags.values():
                            if getattr(tag, "FrameID", None) == "APIC":
                                return True
        except Exception:
            pass

        # Chequeo en carpeta
        directorio = os.path.dirname(ruta)
        if directorio and os.path.exists(directorio):
            for cand in ("cover.jpg", "folder.jpg", "front.jpg", "cover.png", "folder.png", "album.jpg"):
                if os.path.exists(os.path.join(directorio, cand)):
                    return True
        return False

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
    def escribir_metadatos_pro(ruta: str, meta_track: dict, cover_url: str = None, modo_serato: bool = False) -> bool:
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
        comment = str(meta_track.get("comment") or "")
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
        trim_end_ms = float(meta_track.get("trim_end_ms") or 0.0)

        dance_raw = meta_track.get("danceability") or meta_track.get("dance") or meta_track.get("d") or 85
        try:
            dance_val = int(re.sub(r"[^\d]", "", str(dance_raw)) or "85")
        except Exception:
            dance_val = 85

        energy_raw = meta_track.get("energy") or meta_track.get("energia") or meta_track.get("e") or 80
        try:
            energy_val = int(re.sub(r"[^\d]", "", str(energy_raw)) or "80")
        except Exception:
            energy_val = 80

        mood_val = str(meta_track.get("mood") or "Peak Time").strip()
        cues_list = meta_track.get("cues") or []
        es_serato = modo_serato or bool(meta_track.get("modo_serato")) or bool(meta_track.get("export_serato"))

        # 1. Agrupamiento (Grouping): Solo el Mood
        grouping_val = mood_val

        # 2. Etiqueta (Label): La Energía
        label_val = f"⚡{energy_val}%"

        # 3. Remixer: La Danceability
        if es_serato or not meta_track.get("remixer"):
            remixer_val = f"🕺{dance_val}%"
        else:
            remixer_val = str(meta_track.get("remixer") or meta_track.get("version") or "").strip()

        # 4. Álbum: En modo Serato (o por defecto), Subgénero y Mix Armónico táctico:
        # Ejemplo: [BUILD-UP E81%] Dark / Industrial. Mix Armónico: 7A (Neutral) • 8A/6A (Cambio Energía)
        from services.mood_intelligence_service import MoodIntelligenceService
        sub_display = str(
            subgenre_val or
            meta_track.get("mood_subtag") or
            meta_track.get("subtag") or
            (f"{mood_val} / {genre_val}" if genre_val and genre_val != mood_val else f"{mood_val} / Driving")
        ).strip()

        tactical_album = MoodIntelligenceService.generar_album_tactico_serato(
            bpm=bpm_float,
            key=key_camelot,
            mood=mood_val,
            subtag=sub_display,
            subgenre=sub_display,
            energy=energy_val,
            lang="es"
        )

        if es_serato or not meta_track.get("album") or meta_track.get("album") in ("CleanDJmix PRO", ""):
            album_val = tactical_album
        else:
            album_val = str(meta_track.get("album"))

        # 5. Comentario: Sin BPM ni Tonalidad (Estructura y Ubicación DJ)
        raw_cmt = str(comment).strip()
        if es_serato or not raw_cmt or any(x in raw_cmt for x in ("BPM", "Mix Armónico", "Harmonic Mix")) or raw_cmt.startswith("["):
            tactical_comment = MoodIntelligenceService.generar_comentario_tactico(
                bpm=bpm_float,
                key=key_camelot,
                mood=mood_val,
                subtag=sub_display,
                energy=energy_val,
                cues=cues_list,
                first_downbeat_ms=downbeat_ms,
                lang="es"
            )
        else:
            tactical_comment = raw_cmt

        composer_val = str(meta_track.get("composer") or meta_track.get("acoustic_role") or f"⚡E:{energy_val}% 🕺D:{dance_val}%").strip()
        year_raw = str(meta_track.get("year") or meta_track.get("y") or meta_track.get("date") or "").strip()
        year_match = re.search(r'\b(19\d\d|20\d\d)\b', year_raw)
        year_str = year_match.group(1) if year_match else ""

        # Serato Markers2 (GEOB binario oficial + base64)
        serato_b64 = AudioProcessorService.generar_serato_markers2(
            duration_ms=dur_ms,
            bpm=bpm_float,
            cues=cues_list,
            downbeat_ms=downbeat_ms
        )
        serato_markers2_geob = AudioProcessorService.empaquetar_geob_serato_markers2(serato_b64)

        # Serato Markers_ (Legacy v1 binario para compatibilidad universal)
        serato_markers_v1_bin = AudioProcessorService.generar_serato_markers_v1(
            cues=cues_list,
            duration_ms=dur_ms
        )

        # Serato BeatGrid binario oficial
        serato_beatgrid_bin = AudioProcessorService.serializar_serato_beatgrid(
            bpm=bpm_float,
            downbeat_ms=downbeat_ms
        )

        # Serato Autotags binario oficial
        autotags_data = b"\x01\x01" + f"{bpm_str}\x00-3.000\x000.000\x00".encode("ascii")

        # Payloads empaquetados para contenedores FLAC y MP4
        flac_markers2_payload = b"application/octet-stream\x00\x00Serato Markers2\x00" + serato_markers2_geob
        flac_markers2_b64 = base64.b64encode(flac_markers2_payload).decode("ascii")
        flac_markers2_str = "\n".join(flac_markers2_b64[i:i+72] for i in range(0, len(flac_markers2_b64), 72))

        flac_markers1_payload = b"application/octet-stream\x00\x00Serato Markers_\x00" + serato_markers_v1_bin
        flac_markers1_b64 = base64.b64encode(flac_markers1_payload).decode("ascii")
        flac_markers1_str = "\n".join(flac_markers1_b64[i:i+72] for i in range(0, len(flac_markers1_b64), 72))

        flac_beatgrid_payload = b"application/octet-stream\x00\x00Serato BeatGrid\x00" + serato_beatgrid_bin
        flac_beatgrid_b64 = base64.b64encode(flac_beatgrid_payload).decode("ascii")

        flac_autotags_payload = b"application/octet-stream\x00\x00Serato Autotags\x00" + autotags_data
        flac_autotags_b64 = base64.b64encode(flac_autotags_payload).decode("ascii")

        cover_source = cover_url or meta_track.get("cover") or meta_track.get("cover_url") or meta_track.get("image_url")
        if not cover_source:
            cover_source = AudioProcessorService.resolver_caratula_local_o_remota(ruta, artist, title)
        cover_bytes = AudioProcessorService.procesar_caratula_cuadrada(cover_source) if cover_source else b""

        real_fmt = AudioProcessorService.detectar_formato_audio(ruta)
        file_ext = ext.replace(".", "").lower()
        if file_ext and real_fmt and file_ext != real_fmt and not (file_ext in ("aif", "aiff") and real_fmt in ("aif", "aiff")):
            print(f"[AUDITORÍA AUDIO] Discrepancia de contenedor en '{os.path.basename(ruta)}': extensión .{file_ext} pero formato real '{real_fmt.upper()}'. Inyectando tags nativos {real_fmt.upper()}.")

        try:
            if real_fmt == "flac":
                try:
                    audio = FLAC(ruta)
                except (FLACNoHeaderError, Exception) as flac_err:
                    # Fallback si el parser FLAC falla por cabecera id3 o ftyp discrepante
                    with open(ruta, "rb") as f_head:
                        h = f_head.read(32)
                    if h.startswith(b"ID3") or (len(h) >= 2 and h[0] == 0xFF):
                        real_fmt = "mp3"
                    elif b"ftyp" in h or b"moov" in h:
                        real_fmt = "m4a"
                    else:
                        print(f"[META ERROR] Cabecera FLAC no válida en: {ruta} ({flac_err})")
                        return False

            if real_fmt == "flac":
                audio = FLAC(ruta)
                audio["TITLE"] = [title]
                audio["ARTIST"] = [artist]
                audio["ALBUM"] = [album_val]
                audio["BPM"] = [bpm_str]
                if key_camelot:
                    audio["INITIALKEY"] = [key_camelot]
                    audio["KEY"] = [key_camelot]
                audio["GROUPING"] = [grouping_val]
                audio["LABEL"] = [label_val]
                audio["ORGANIZATION"] = [label_val]
                audio["PUBLISHER"] = [label_val]
                audio["COMMENT"] = [tactical_comment]
                audio["DESCRIPTION"] = [tactical_comment]
                audio["GENRE"] = [genre_full]
                if subgenre_val:
                    audio["SUBGENRE"] = [subgenre_val]
                if remixer_val:
                    audio["REMIXER"] = [remixer_val]
                if composer_val:
                    audio["COMPOSER"] = [composer_val]
                if year_str:
                    audio["DATE"] = [year_str]
                    audio["YEAR"] = [year_str]
                if isrc:
                    audio["ISRC"] = [isrc]
                audio["DANCEABILITY"] = [str(dance_val)]
                audio["ENERGY"] = [str(energy_val)]
                audio["MOOD"] = [mood_val]
                audio["SERATO_PLAYLIST"] = [mood_val]
                if trim_ms > 0:
                    audio["TRIM_START_MS"] = [f"{trim_ms:.1f}"]
                if trim_end_ms > 0:
                    audio["TRIM_END_MS"] = [f"{trim_end_ms:.1f}"]
                if downbeat_ms > 0:
                    audio["FIRST_DOWNBEAT_MS"] = [f"{downbeat_ms:.1f}"]

                # Metadatos nativos Serato DJ en VORBIS_COMMENT
                audio["SERATO_MARKERS_V2"] = [flac_markers2_str]
                audio["SERATO_MARKERS"] = [flac_markers1_str]
                audio["SERATO_BEATGRID"] = [flac_beatgrid_b64]
                audio["SERATO_AUTOGAIN"] = [flac_autotags_b64]

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

            elif real_fmt == "mp3":
                try:
                    id3 = ID3(ruta)
                except ID3NoHeaderError:
                    id3 = ID3()

                # ID3v2.3 (estándar nativo Serato DJ Pro / CDJ Pioneer)
                # encoding=1 (UTF-16 con BOM) requerido para compatibilidad absoluta en Serato
                id3.add(TIT2(encoding=1, text=[title]))
                id3.add(TPE1(encoding=1, text=[artist]))
                id3.add(TALB(encoding=1, text=[album_val]))
                id3.add(TBPM(encoding=1, text=[bpm_str]))
                if key_camelot:
                    id3.add(TKEY(encoding=1, text=[key_camelot]))
                    id3.add(TXXX(encoding=1, desc="INITIALKEY", text=[key_camelot]))
                    id3.add(TXXX(encoding=1, desc="KEY", text=[key_camelot]))

                # Inyección de Grouping (TIT1): Columna visible en Serato DJ Pro solo para Mood
                id3.add(TIT1(encoding=1, text=[grouping_val]))

                # Inyección de Etiqueta (TPUB): Columna visible en Serato DJ Pro para Energía
                id3.add(TPUB(encoding=1, text=[label_val]))
                id3.add(TXXX(encoding=1, desc="LABEL", text=[label_val]))
                id3.add(TXXX(encoding=1, desc="ORGANIZATION", text=[label_val]))

                # Inyección de Remixer (TPE4): Columna visible en Serato DJ Pro para Danceability
                id3.add(TPE4(encoding=1, text=[remixer_val]))

                # Inyección de Comentario Táctico sin BPM ni Tonalidad (Estructura y Ubicación DJ)
                id3.add(COMM(encoding=1, lang="eng", desc="", text=[tactical_comment]))
                id3.add(TCON(encoding=1, text=[genre_full]))
                if subgenre_val:
                    id3.add(TXXX(encoding=1, desc="SUBGENRE", text=[subgenre_val]))
                if composer_val:
                    id3.add(TCOM(encoding=1, text=[composer_val]))
                if year_str:
                    id3.add(TYER(encoding=1, text=[year_str]))
                if isrc:
                    id3.add(TSRC(encoding=1, text=[isrc]))

                id3.add(TXXX(encoding=1, desc="DANCEABILITY", text=[str(dance_val)]))
                id3.add(TXXX(encoding=1, desc="ENERGY", text=[str(energy_val)]))
                id3.add(TXXX(encoding=1, desc="MOOD", text=[mood_val]))
                id3.add(TXXX(encoding=1, desc="SERATO_PLAYLIST", text=[mood_val]))

                if trim_ms > 0:
                    id3.add(TXXX(encoding=1, desc="TRIM_START_MS", text=[f"{trim_ms:.1f}"]))
                if trim_end_ms > 0:
                    id3.add(TXXX(encoding=1, desc="TRIM_END_MS", text=[f"{trim_end_ms:.1f}"]))
                if downbeat_ms > 0:
                    id3.add(TXXX(encoding=1, desc="FIRST_DOWNBEAT_MS", text=[f"{downbeat_ms:.1f}"]))

                # Inyección GEOB Serato Markers2 (Moderna con cabecera binaria oficial \x01\x01 y padding)
                id3.add(GEOB(
                    encoding=0,
                    mime="application/octet-stream",
                    desc="Serato Markers2",
                    data=serato_markers2_geob
                ))
                # Inyección GEOB Serato Markers_ (Legacy v1 para compatibilidad histórica)
                id3.add(GEOB(
                    encoding=0,
                    mime="application/octet-stream",
                    desc="Serato Markers_",
                    data=serato_markers_v1_bin
                ))
                # Inyección GEOB Serato BeatGrid
                id3.add(GEOB(
                    encoding=0,
                    mime="application/octet-stream",
                    desc="Serato BeatGrid",
                    data=serato_beatgrid_bin
                ))
                # Inyección GEOB Serato Autotags
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
                            encoding=0,
                            mime="image/jpeg",
                            type=3,
                            desc="Cover",
                            data=cover_bytes
                        ))
                    except Exception as a_err:
                        print(f"[ARTWORK WARN] Fallo incrustando carátula MP3: {a_err}")

                # Guardar siempre como ID3v2.3 para compatibilidad nativa Serato DJ Pro
                id3.save(ruta, v2_version=3)
                return True

            elif real_fmt in ("aiff", "aif", ".aiff", ".aif"):
                audio = AIFF(ruta)
                if audio.tags is None:
                    audio.add_tags()
                tags = audio.tags
                tags.add(TIT2(encoding=1, text=[title]))
                tags.add(TPE1(encoding=1, text=[artist]))
                tags.add(TALB(encoding=1, text=[album_val]))
                tags.add(TBPM(encoding=1, text=[bpm_str]))
                if key_camelot:
                    tags.add(TKEY(encoding=1, text=[key_camelot]))
                    tags.add(TXXX(encoding=1, desc="INITIALKEY", text=[key_camelot]))
                    tags.add(TXXX(encoding=1, desc="KEY", text=[key_camelot]))
                tags.add(TIT1(encoding=1, text=[grouping_val]))
                tags.add(TPUB(encoding=1, text=[label_val]))
                tags.add(TXXX(encoding=1, desc="LABEL", text=[label_val]))
                tags.add(TXXX(encoding=1, desc="ORGANIZATION", text=[label_val]))
                tags.add(TPE4(encoding=1, text=[remixer_val]))
                tags.add(COMM(encoding=1, lang="eng", desc="", text=[tactical_comment]))
                tags.add(TCON(encoding=1, text=[genre_full]))
                if subgenre_val:
                    tags.add(TXXX(encoding=1, desc="SUBGENRE", text=[subgenre_val]))
                if composer_val:
                    tags.add(TCOM(encoding=1, text=[composer_val]))
                if year_str:
                    tags.add(TYER(encoding=1, text=[year_str]))
                tags.add(TXXX(encoding=1, desc="DANCEABILITY", text=[str(dance_val)]))
                tags.add(TXXX(encoding=1, desc="ENERGY", text=[str(energy_val)]))
                tags.add(TXXX(encoding=1, desc="MOOD", text=[mood_val]))
                tags.add(TXXX(encoding=1, desc="SERATO_PLAYLIST", text=[mood_val]))
                if trim_ms > 0:
                    tags.add(TXXX(encoding=1, desc="TRIM_START_MS", text=[f"{trim_ms:.1f}"]))
                if downbeat_ms > 0:
                    tags.add(TXXX(encoding=1, desc="FIRST_DOWNBEAT_MS", text=[f"{downbeat_ms:.1f}"]))
                tags.add(GEOB(encoding=0, mime="application/octet-stream", desc="Serato Markers2", data=serato_markers2_geob))
                tags.add(GEOB(encoding=0, mime="application/octet-stream", desc="Serato Markers_", data=serato_markers_v1_bin))
                tags.add(GEOB(encoding=0, mime="application/octet-stream", desc="Serato BeatGrid", data=serato_beatgrid_bin))
                tags.add(GEOB(encoding=0, mime="application/octet-stream", desc="Serato Autotags", data=autotags_data))

                if cover_bytes:
                    try:
                        tags.delall("APIC")
                        tags.add(APIC(
                            encoding=0,
                            mime="image/jpeg",
                            type=3,
                            desc="Cover",
                            data=cover_bytes
                        ))
                    except Exception as a_err:
                        print(f"[ARTWORK WARN] Fallo incrustando carátula AIFF: {a_err}")

                audio.save()
                return True

            elif real_fmt in ("m4a", "aac", "mp4", ".m4a", ".aac"):
                audio = MP4(ruta)
                audio["\xa9nam"] = [title]
                audio["\xa9ART"] = [artist]
                audio["\xa9alb"] = [album_val]
                try:
                    audio["tmpo"] = [int(bpm_float)]
                except Exception:
                    pass
                audio["\xa9cmt"] = [tactical_comment]
                audio["\xa9gen"] = [genre_full]
                audio["\xa9grp"] = [grouping_val]
                audio["----:com.apple.iTunes:LABEL"] = [label_val.encode("utf-8")]
                audio["----:com.apple.iTunes:ORGANIZATION"] = [label_val.encode("utf-8")]
                audio["----:com.apple.iTunes:REMIXER"] = [remixer_val.encode("utf-8")]
                if subgenre_val:
                    audio["----:com.apple.iTunes:SUBGENRE"] = [subgenre_val.encode("utf-8")]
                if key_camelot:
                    audio["----:com.apple.iTunes:initialkey"] = [key_camelot.encode("utf-8")]
                    audio["----:com.apple.iTunes:KEY"] = [key_camelot.encode("utf-8")]
                if composer_val:
                    audio["\xa9wrt"] = [composer_val]
                if year_str:
                    audio["\xa9day"] = [year_str]
                audio["----:com.apple.iTunes:DANCEABILITY"] = [str(dance_val).encode("utf-8")]
                audio["----:com.apple.iTunes:ENERGY"] = [str(energy_val).encode("utf-8")]
                audio["----:com.apple.iTunes:MOOD"] = [mood_val.encode("utf-8")]
                if trim_ms > 0:
                    audio["----:com.apple.iTunes:TRIM_START_MS"] = [f"{trim_ms:.1f}".encode("utf-8")]
                if trim_end_ms > 0:
                    audio["----:com.apple.iTunes:TRIM_END_MS"] = [f"{trim_end_ms:.1f}".encode("utf-8")]
                if downbeat_ms > 0:
                    audio["----:com.apple.iTunes:FIRST_DOWNBEAT_MS"] = [f"{downbeat_ms:.1f}".encode("utf-8")]

                # Inyección oficial de átomos Serato DJ en MP4/M4A
                audio["----:com.serato.dj:markersv2"] = [flac_markers2_str.encode("ascii")]
                audio["----:com.serato.dj:markers"] = [flac_markers1_str.encode("ascii")]
                audio["----:com.serato.dj:beatgrid"] = [flac_beatgrid_b64.encode("ascii")]
                audio["----:com.serato.dj:autgain"] = [flac_autotags_b64.encode("ascii")]

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
