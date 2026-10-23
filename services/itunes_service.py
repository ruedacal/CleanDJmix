# services/itunes_service.py
import os
import plistlib

class iTunesService:
    def __init__(self):
        pass

    def parse_library_xml(self, xml_path: str):
        """Analiza el archivo 'Library.xml' exportado por iTunes / Apple Music."""
        if not os.path.exists(xml_path):
            return {"error": "Biblioteca XML de iTunes no encontrada"}
            
        try:
            with open(xml_path, 'rb') as f:
                data = plistlib.load(f)
            
            tracks_raw = data.get('Tracks', {})
            tracks_parsed = []
            
            for track_id, info in tracks_raw.items():
                tracks_parsed.append({
                    "track_id": track_id,
                    "name": info.get("Name"),
                    "artist": info.get("Artist"),
                    "album": info.get("Album"),
                    "genre": info.get("Genre"),
                    "bpm": info.get("BPM"),
                    "year": info.get("Year"),
                    "location": info.get("Location")
                })
                
            return {
                "success": True,
                "total_tracks": len(tracks_parsed),
                "tracks": tracks_parsed[:100] # Muestra inicial optimizada
            }
        except Exception as e:
            return {"success": False, "error": str(e)}