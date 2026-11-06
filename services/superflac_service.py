# services/superflac_service.py
import os
import mutagen
from mutagen.flac import FLAC

class SuperFlacService:
    def __init__(self):
        pass

    def analyze_flac_file(self, file_path: str):
        """Extrae metadatos técnicos y tags de un archivo FLAC de alta resolución."""
        if not os.path.exists(file_path):
            return {"error": "Archivo no encontrado"}
            
        try:
            audio = FLAC(file_path)
            info = audio.info
            tags = {key: audio[key][0] for key in audio.keys() if audio[key]}
            
            return {
                "success": True,
                "file": os.path.basename(file_path),
                "sample_rate": getattr(info, 'sample_rate', None),
                "bit_depth": getattr(info, 'bits_per_sample', None),
                "channels": getattr(info, 'channels', None),
                "length_seconds": getattr(info, 'length', 0),
                "bitrate": getattr(info, 'bitrate', 0),
                "tags": {
                    "title": tags.get("TITLE", [tags.get("title", "Unknown")]),
                    "artist": tags.get("ARTIST", [tags.get("artist", "Unknown")]),
                    "album": tags.get("ALBUM", [tags.get("album", "Unknown")]),
                    "genre": tags.get("GENRE", [tags.get("genre", "")]),
                    "date": tags.get("DATE", [tags.get("date", "")])
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}