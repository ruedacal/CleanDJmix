"""
Servicio de Consulta e Identificación Reversa de Discogs para BeatWave DJ_MetaTagger.
Permite consultar metadatos de lanzamientos, géneros y estilos oficiales (styles)
emulando un cliente web de alta fidelidad, con caché local en memoria y disco,
sin requerir tokens privados ni claves de API de pago por parte del usuario.
"""

import urllib.request
import urllib.parse
import json
import ssl
import time
import os
import re
from typing import Optional, Dict, Any, List, Tuple
from domain.music_taxonomy import MusicTaxonomy


class DiscogsService:
    _CACHE: Dict[str, Dict[str, Any]] = {}
    _CACHE_FILE = os.path.expanduser("~/.gemini/antigravity/discogs_cache.json")
    _LAST_REQUEST_TIME = 0.0
    _MIN_REQUEST_INTERVAL = 0.6  # 600ms entre peticiones para cortesía y evitar rate limiting

    @classmethod
    def _init_cache(cls):
        if not cls._CACHE and os.path.exists(cls._CACHE_FILE):
            try:
                with open(cls._CACHE_FILE, "r", encoding="utf-8") as f:
                    cls._CACHE = json.load(f)
            except Exception:
                cls._CACHE = {}

    @classmethod
    def _save_cache(cls):
        try:
            os.makedirs(os.path.dirname(cls._CACHE_FILE), exist_ok=True)
            with open(cls._CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(cls._CACHE, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    @classmethod
    def buscar_release(cls, query: str, timeout: float = 3.0) -> Optional[Dict[str, Any]]:
        """
        Busca un release en Discogs mediante endpoint público emulado.
        Devuelve {'title': str, 'genres': List[str], 'styles': List[str], 'year': str} o None.
        """
        cls._init_cache()
        query_key = query.strip().lower()
        if not query_key:
            return None

        # Comprobar caché
        if query_key in cls._CACHE:
            return cls._CACHE[query_key]

        # Rate limiter suave
        now = time.time()
        elapsed = now - cls._LAST_REQUEST_TIME
        if elapsed < cls._MIN_REQUEST_INTERVAL:
            time.sleep(cls._MIN_REQUEST_INTERVAL - elapsed)
        cls._LAST_REQUEST_TIME = time.time()

        encoded_q = urllib.parse.quote_plus(query)
        url = f"https://api.discogs.com/database/search?q={encoded_q}&type=release"

        # Headers de navegador moderno para emulación transparente
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
            "Referer": "https://www.discogs.com/"
        }

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, context=ctx, timeout=timeout) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    results = data.get("results", [])
                    if results:
                        first = results[0]
                        res_obj = {
                            "title": first.get("title", ""),
                            "genres": first.get("genre", []),
                            "styles": first.get("style", []),
                            "year": first.get("year", ""),
                            "country": first.get("country", "")
                        }
                        cls._CACHE[query_key] = res_obj
                        # Guardar periódicamente en caché
                        if len(cls._CACHE) % 5 == 0:
                            cls._save_cache()
                        return res_obj
        except Exception:
            pass

        # Si no hubo resultados o falló la conexión
        cls._CACHE[query_key] = None
        return None

    @classmethod
    def resolver_genero_disco(
        cls,
        artist: Optional[str] = None,
        title: Optional[str] = None,
        raw_genre: Optional[str] = None,
        raw_subgenre: Optional[str] = None,
        bpm: Optional[float] = None
    ) -> Tuple[str, str]:
        """
        Resuelve el género y subgénero consultando Discogs y normalizando con MusicTaxonomy.
        Si Discogs no devuelve resultado o no hay certeza, MusicTaxonomy asignará 'Desconocido'.
        """
        art = str(artist or "").strip()
        tit = str(title or "").strip()

        discogs_genres = []
        discogs_styles = []

        query = f"{art} {tit}".strip()
        if query and query.lower() not in ["unknown", "desconocido", "untitled"]:
            res = cls.buscar_release(query)
            if res:
                discogs_genres = res.get("genres", [])
                discogs_styles = res.get("styles", [])

        # Enviar todo a la Taxonomía Canónica Universal
        all_styles = list(discogs_styles)
        if raw_subgenre:
            all_styles.append(raw_subgenre)

        genre, subgenre = MusicTaxonomy.normalizar_genero_y_subgenero(
            raw_genre=raw_genre or (discogs_genres[0] if discogs_genres else None),
            raw_subgenre=raw_subgenre,
            raw_styles=all_styles,
            artist=art,
            title=tit,
            bpm=bpm
        )

        return genre, subgenre
