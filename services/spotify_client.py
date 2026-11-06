import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth

class SpotifyService:
    def __init__(self):
        self.client_id = os.getenv("SPOTIPY_CLIENT_ID")
        self.client_secret = os.getenv("SPOTIPY_CLIENT_SECRET")
        self.redirect_uri = os.getenv("SPOTIPY_REDIRECT_URI", "http://localhost:8888/callback")
        
    def get_client(self, token_info=None):
        if token_info:
            cache_handler = spotipy.cache_handler.MemoryCacheHandler(token_info)
            return spotipy.Spotify(auth_manager=SpotifyOAuth(
                client_id=self.client_id,
                client_secret=self.client_secret,
                redirect_uri=self.redirect_uri,
                cache_handler=cache_handler,
                open_browser=False
            ))
        return None

    def search_track(self, sp, query: str):
        try:
            results = sp.search(q=query, type='track', limit=1)
            items = results.get('tracks', {}).get('items', [])
            if items:
                track = items[0]
                return {
                    "id": track["id"],
                    "name": track["name"],
                    "artist": track["artists"][0]["name"],
                    "album": track["album"]["name"],
                    "uri": track["uri"],
                    "popularity": track["popularity"]
                }
            return None
        except Exception as e:
            print(f"[Error Spotify Service] {e}")
            return None
