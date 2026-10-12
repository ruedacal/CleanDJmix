"""
Módulo de Dominio: Contiene las reglas de negocio puras y la lógica central de CleanDJmix PRO.
Este módulo es independiente de la interfaz gráfica y de librerías externas de E/S.
"""

import re

class TrackDomain:
    """Clase encargada de encapsular las reglas de negocio y procesamiento lógico musical."""

    @staticmethod
    def limpiar_texto(texto: str) -> str:
        """
        Limpia cadenas de texto eliminando caracteres basura, URLs, extensiones y etiquetas innecesarias.
        
        Args:
            texto (str): Texto crudo (nombre de archivo o etiqueta ID3).
            
        Returns:
            str: Texto limpio y normalizado.
        """
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
    def cerebro_ishkur(bpm: float, año: int, estilos: list, presencia_vocal: float, zcr: float, centroide: float) -> str:
        """
        Algoritmo clasificador basado en el criterio de Ishkur para determinar el género DJ definitivo.
        
        Args:
            bpm (float): Velocidad de la pista en beats por minuto.
            año (int): Año real de lanzamiento de la pista.
            estilos (list): Lista de estilos musicales obtenidos de bases de datos externas.
            presencia_vocal (float): Métrica acústica de variación en coeficientes MFCC.
            zcr (float): Tasa de cruce por cero (Zero Crossing Rate) para medir brillo/distorsión.
            centroide (float): Centroide espectral del audio.
            
        Returns:
            str: Nombre de la carpeta/género de destino (ej. 'Techno', 'Trance', 'Remember', etc.).
        """
        estilos_str = " ".join(estilos)
        
        # 1. Filtro histórico estricto para música Remember
        if 1980 < año < 2011: 
            return "Remember"
            
        # 2. Comprobación prioritaria por etiquetas de estilo explícitas de Internet/Discogs
        if "schranz" in estilos_str or "hard techno" in estilos_str or "industrial" in estilos_str or "techno" in estilos_str: 
            return "Techno"
        if "tech house" in estilos_str: 
            return "Tech House"
        if "trance" in estilos_str or "psy-trance" in estilos_str: 
            return "Trance"
        if "eurodance" in estilos_str or "makina" in estilos_str or "happy hardcore" in estilos_str: 
            return "Cantaditas"
            
        # 3. Detección por umbrales acústicos si no hay etiquetas claras de estilo
        if presencia_vocal > 3000 and 130 <= bpm <= 145: 
            return "Cantaditas"
        if bpm >= 135 and centroide > 2500 and presencia_vocal < 2000: 
            return "Trance"
        if "house" in estilos_str and "tech" not in estilos_str: 
            return "House"
        
        # 4. Fallback matemático final
        if bpm > 138 and zcr > 0.08: 
            return "Techno"
        elif bpm > 128: 
            return "Techno"
        else: 
            return "Tech House"
