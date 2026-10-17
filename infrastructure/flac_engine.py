import os
import requests
from mutagen.flac import FLAC, Picture

class FlacEngineService:
    @staticmethod
    def descargar_stream_flac(url_audio: str, ruta_destino: str, callback_progreso=None) -> bool:
        """Descarga un flujo FLAC por chunks para mantener bajo consumo de memoria."""
        try:
            os.makedirs(os.path.dirname(ruta_destino), exist_ok=True)
            with requests.get(url_audio, stream=True, timeout=30) as r:
                r.raise_for_status()
                total_length = int(r.headers.get('content-length', 0))
                dl = 0
                with open(ruta_destino, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=65536):
                        if chunk:
                            f.write(chunk)
                            dl += len(chunk)
                            if callback_progreso and total_length:
                                callback_progreso(int((dl / total_length) * 100))
            return os.path.exists(ruta_destino) and os.path.getsize(ruta_destino) > 0
        except Exception as e:
            print(f"[FlacEngine] Error en descarga: {e}")
            if os.path.exists(ruta_destino):
                os.remove(ruta_destino)
            return False

    @staticmethod
    def inyectar_metadatos_flac(ruta_flac: str, metadatos: dict, url_caratula: str = None) -> bool:
        """Escribe etiquetas Vorbis Comments e incrusta la carátula oficial en el archivo FLAC."""
        try:
            audio = FLAC(ruta_flac)
            
            # Mapeo de Vorbis Comments estándar para DJs (Rekordbox / Serato compatible)
            if "title" in metadatos:
                audio["TITLE"] = metadatos["title"]
            if "artist" in metadatos:
                audio["ARTIST"] = metadatos["artist"]
            if "album" in metadatos:
                audio["ALBUM"] = metadatos["album"]
            if "bpm" in metadatos and metadatos["bpm"]:
                audio["BPM"] = str(metadatos["bpm"])
            if "key" in metadatos and metadatos["key"]:
                audio["INITIALKEY"] = str(metadatos["key"])
            if "isrc" in metadatos and metadatos["isrc"]:
                audio["ISRC"] = str(metadatos["isrc"])
            
            # Incrustación de carátula en el bloque METADATA_BLOCK_PICTURE
            if url_caratula:
                try:
                    img_data = requests.get(url_caratula, timeout=10).content
                    pic = Picture()
                    pic.data = img_data
                    pic.type = 3  # Cover front
                    pic.mime = "image/jpeg"
                    audio.clear_pictures()
                    audio.add_picture(pic)
                except Exception as img_err:
                    print(f"[FlacEngine] Error al incrustar carátula: {img_err}")

            audio.save()
            return True
        except Exception as e:
            print(f"[FlacEngine] Error escribiendo tags FLAC: {e}")
            return False
