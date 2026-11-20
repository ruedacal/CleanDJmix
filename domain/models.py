"""
Módulo de Dominio: Taxonomía y reglas de negocio para BeatWave DJ_MetaTagger.
Conectado con MusicTaxonomy (Wikipedia & Club DJ) y soporte universal multi-género.
"""

import re
from typing import Tuple, List, Optional
from domain.music_taxonomy import MusicTaxonomy

# Taxonomía profesional canónica simplificada
TAXONOMIA_ELECTRONICA = MusicTaxonomy.ELECTRONIC_TAXONOMY


class TrackDomain:
    """Clase encargada de encapsular las reglas de negocio y taxonomía musical."""

    @staticmethod
    def limpiar_texto(texto: str) -> str:
        """Limpia cadenas de texto eliminando basura, URLs y extensiones."""
        if not texto: 
            return ""
        texto = re.sub(r'(?i)_?spotdown\.org', '', texto)
        texto = re.sub(r'(?i)\.mp3', '', texto)
        texto = re.sub(r'(?i)\.flac', '', texto)
        texto = re.sub(r'(?i)\.wav', '', texto)
        texto = re.sub(r'(?i)(www\.|http)[^\s]+', '', texto)
        texto = re.sub(r'^\d+[_ -]+', '', texto)
        texto = re.sub(r'\[.*?\]', '', texto)
        texto = re.sub(r'\(.*?\)', '', texto)
        texto = texto.replace('_', ' ')
        return re.sub(r'\s+', ' ', texto).strip()

    @staticmethod
    def cerebro_ishkur(
        bpm: float,
        año: int,
        estilos: list,
        presencia_vocal: float = 0.0,
        zcr: float = 0.0,
        centroide: float = 0.0,
        artist: Optional[str] = None,
        title: Optional[str] = None
    ) -> Tuple[str, str]:
        """
        Clasifica la pista devolviendo una tupla (GeneroPrincipal, Subgenero)
        según la taxonomía canónica universal.
        Si no hay certeza comprobada, devuelve estrictamente ('Desconocido', 'Desconocido').
        """
        # Delegar en la Taxonomía Canónica Universal
        g, sub = MusicTaxonomy.normalizar_genero_y_subgenero(
            raw_styles=estilos,
            artist=artist,
            title=title,
            bpm=bpm
        )
        return g, sub
