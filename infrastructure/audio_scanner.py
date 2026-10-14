import os
import mutagen

class AudioScannerService:
    @staticmethod
    def auditar_archivo(ruta_absoluta, idx):
        nombre_archivo = os.path.basename(ruta_absoluta)
        track_info = {
            "id": idx, "f": nombre_archivo, "titulo": nombre_archivo,
            "a": "Desconocido", "d": "00:00", "b": "0.0", "k": "--",
            "s": "error", "path": ruta_absoluta,
            "cover_url": "https://placehold.co/100x100/18181b/22d3ee?text=AUDIO",
            "audio_preview": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        }
        try:
            audio = mutagen.File(ruta_absoluta, easy=True)
            if audio:
                track_info["titulo"] = audio.get("title", [nombre_archivo])[0]
                track_info["a"] = audio.get("artist", ["Desconocido"])[0]
                track_info["b"] = audio.get("bpm", ["0.0"])[0]
                track_info["k"] = audio.get("initialkey", ["--"])[0]
                if audio.info and hasattr(audio.info, 'length'):
                    m, s = divmod(int(audio.info.length), 60)
                    track_info["d"] = f"{m:02d}:{s:02d}"
                if track_info["b"] != "0.0" and track_info["k"] != "--":
                    track_info["s"] = "ok"
        except Exception:
            pass
        return track_info
