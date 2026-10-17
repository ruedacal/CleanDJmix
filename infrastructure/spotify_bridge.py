# infrastructure/spotify_bridge.py
from infrastructure.flac_engine import FlacEngineService

@eel.expose
def py_descargar_track_flac(spotify_track_id, ruta_destino_carpeta):
    """
    1. Obtiene metadatos e ISRC mediante Spotipy Web API.
    2. Resuelve el stream FLAC lossless en el resolver (Qobuz/Tidal).
    3. Descarga el stream a ruta_destino_carpeta/<Artista> - <Titulo>.flac.
    4. Inyecta tags Vorbis y carátula HD.
    """
    # Lógica de orquestación asíncrona
    pass
