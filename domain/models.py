"""
Módulo de Dominio: Contiene las reglas de negocio puras, taxonomía avanzada 
de géneros/subgéneros de música electrónica y el clasificador Ishkur.
"""

import re

# Taxonomía profesional de géneros y subgéneros electrónicos
TAXONOMIA_ELECTRONICA = {
    "Techno": ["Hard Techno", "Melodic Techno", "Industrial Techno", "Acid Techno", "Minimal Techno"],
    "House": ["Deep House", "Tech House", "Afro House", "Progressive House", "Funky House"],
    "Trance": ["Psy-Trance", "Uplifting Trance", "Hard Trance", "Progressive Trance"],
    "Cantaditas": ["Makina", "Eurodance", "Happy Hardcore", "Bakalao", "Vocal Trance"],
    "Remember": ["Classic House", "Classic Trance", "Retro Techno", "Classic Makina"]
}

class TrackDomain:
    """Clase encargada de encapsular las reglas de negocio y taxonomía musical."""

    @staticmethod
    def limpiar_texto(texto: str) -> str:
        """Limpia cadenas de texto eliminando basura, URLs y extensiones."""
        if not texto: 
            return ""
        texto = re.sub(r'(?i)_?spotdown\.org', '', texto)
        texto = re.sub(r'(?i)\.mp3', '', texto)
        texto = re.sub(r'(?i)(www\.|http)[^\s]+', '', texto)
        texto = re.sub(r'^\d+[_ -]+', '', texto)
        texto = re.sub(r'\[.*?\]', '', texto)
        texto = re.sub(r'\(.*?\)', '', texto)
        texto = texto.replace('_', ' ')
        return re.sub(r'\s+', ' ', texto).strip()

    @staticmethod
    def cerebro_ishkur(bpm: float, año: int, estilos: list, presencia_vocal: float, zcr: float, centroide: float) -> tuple:
        """
        Clasifica la pista devolviendo una tupla (GeneroPrincipal, Subgenero)
        basado en la taxonomía electrónica y métricas acústicas.
        """
        estilos_str = " " .join(estilos).lower()
        
        # 1. Detección de Subgéneros Específicos por Etiquetas
        if "hard techno" in estilos_str or "schranz" in estilos_str or "industrial" in estilos_str:
            return "Techno", "Hard Techno"
        if "melodic techno" in estilos_str:
            return "Techno", "Melodic Techno"
        if "acid" in estilos_str:
            return "Techno", "Acid Techno"
        if "tech house" in estilos_str:
            return "House", "Tech House"
        if "deep house" in estilos_str:
            return "House", "Deep House"
        if "afro house" in estilos_str:
            return "House", "Afro House"
        if "psy-trance" in estilos_str or "psytrance" in estilos_str:
            return "Trance", "Psy-Trance"
        if "uplifting" in estilos_str:
            return "Trance", "Uplifting Trance"
        if "eurodance" in estilos_str or "makina" in estilos_str or "happy hardcore" in estilos_str:
            return "Cantaditas", "Makina / Eurodance"
            
        # 2. Filtro Histórico Remember
        if 1980 < año < 2011: 
            return "Remember", "Retro Classic"
            
        # 3. Clasificación por umbrales acústicos y géneros base
        if "trance" in estilos_str or (bpm >= 135 and centroide > 2500 and presencia_vocal < 2000):
            return "Trance", "Progressive Trance"
        if "house" in estilos_str and "tech" not in estilos_str:
            return "House", "Deep House"
        if "techno" in estilos_str or (bpm > 138 and zcr > 0.08):
            return "Techno", "Minimal Techno"
        
        # 4. Fallback por defecto
        if bpm > 128:
            return "Techno", "Melodic Techno"
        else:
            return "House", "Tech House"
