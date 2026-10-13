"""Fachada unificada de adaptadores con retrocompatibilidad completa para tests."""

from mutagen.easyid3 import EasyID3
from mutagen.id3 import ID3
from mutagen import File as MutagenFile
from shazamio import Shazam

from infrastructure.audio_adapter import AudioAdapter as _AudioAdapterBase
from infrastructure.spotify_adapter import SpotifyDownloaderAdapter as _SpotifyDownloaderAdapterBase

class AudioAdapter(_AudioAdapterBase):
    @classmethod
    def obtener_metadatos_id3(cls, ruta_completa: str, nombre_archivo: str) -> tuple:
        cls.EasyID3_ref = EasyID3
        return super().obtener_metadatos_id3(ruta_completa, nombre_archivo)

    @classmethod
    def rescate_shazam(cls, ruta_completa: str) -> tuple:
        cls.Shazam_ref = Shazam
        return super().rescate_shazam(ruta_completa)

    @classmethod
    def actualizar_fichero(cls, ruta_completa: str, artista: str, titulo: str, año: int, bpm: int, modo_seguro: bool = False) -> str:
        cls.MutagenFile_ref = MutagenFile
        return super().actualizar_fichero(ruta_completa, artista, titulo, año, bpm, modo_seguro)

class SpotifyDownloaderAdapter(_SpotifyDownloaderAdapterBase):
    @classmethod
    def descargar_canciones_seleccionadas(cls, songs_list: list, directorio_salida: str, callback_log=None) -> list:
        cls.EasyID3_ref = EasyID3
        cls.ID3_ref = ID3
        return super().descargar_canciones_seleccionadas(songs_list, directorio_salida, callback_log)

SpotifyAdapter = SpotifyDownloaderAdapter
SpotDLAdapter = SpotifyDownloaderAdapter

__all__ = [
    "EasyID3",
    "ID3",
    "MutagenFile",
    "Shazam",
    "AudioAdapter",
    "SpotifyDownloaderAdapter",
    "SpotifyAdapter",
    "SpotDLAdapter"
]
