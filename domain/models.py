"""
Módulo de Dominio: Taxonomía definitiva de 10 macro-categorías de música electrónica
(con Tech House independiente, Vocales y Remember).
"""

import re

# Taxonomía profesional definitiva ajustada para DJs
TAXONOMIA_ELECTRONICA = {
    "Techno": ["Hard Techno", "Melodic Techno", "Industrial Techno", "Acid Techno", "Minimal Techno"],
    "Tech House": ["Tech House", "Minimal Tech", "Bass House"],
    "House": ["Deep House", "Afro House", "Progressive House", "Funky House"],
    "Trance": ["Psy-Trance", "Uplifting Trance", "Hard Trance", "Progressive Trance"],
    "Vocales (Cantaditas)": ["Vocal Trance", "Dance Pop", "Makina Vocal", "Club Anthems"],
    "Remember & Classics": ["Classic House", "Classic Trance", "Bakalao 90s", "Retro Makina", "Classic Techno"],
    "Hard Dance & Hardcore": ["Hardstyle", "Rawstyle", "Hardcore", "Frenchcore"],
    "Drum & Bass": ["Neurofunk", "Liquid DnB", "Jump Up", "Jungle"],
    "Tech & Progressive": ["Progressive House", "Organic House", "Melodic House"],
    "Ambient & Downtempo": ["Chillout", "Lo-Fi", "Ambient", "Trip Hop"]
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
        según la taxonomía definitiva.
        """
        estilos_str = " ".join(estilos).lower()
        
        # 1. Etiquetas explícitas
        if "tech house" in estilos_str:
            return "Tech House", "Tech House"
        if "hard techno" in estilos_str or "schranz" in estilos_str or "industrial" in estilos_str:
            return "Techno", "Hard Techno"
        if "melodic techno" in estilos_str:
            return "Techno", "Melodic Techno"
        if "acid" in estilos_str:
            return "Techno", "Acid Techno"
        if "deep house" in estilos_str:
            return "House", "Deep House"
        if "afro house" in estilos_str:
            return "House", "Afro House"
        if "psy-trance" in estilos_str or "psytrance" in estilos_str:
            return "Trance", "Psy-Trance"
        if "vocal" in estilos_str or presencia_vocal > 2500:
            return "Vocales (Cantaditas)", "Vocal Trance"
        if "hardstyle" in estilos_str or "rawstyle" in estilos_str:
            return "Hard Dance & Hardcore", "Hardstyle"
            
        # 2. Filtro Histórico Remember (1980 - 2011)
        if 1980 < año < 2011: 
            return "Remember & Classics", "Classic House"
            
        # 3. Umbrales acústicos y BPMs
        if bpm >= 150:
            return "Hard Dance & Hardcore", "Hardcore"
        if bpm >= 135 and centroide > 2500:
            return "Trance", "Uplifting Trance"
        if "house" in estilos_str:
            return "House", "Deep House"
        if bpm > 130:
            return "Techno", "Minimal Techno"
        
        # 4. Fallback por defecto
        return "Tech House", "Tech House"
