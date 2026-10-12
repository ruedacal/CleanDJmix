import re

class TrackDomain:
    @staticmethod
    def limpiar_texto(texto):
        if not texto: return ""
        texto = re.sub(r'(?i)_?spotdown\.org', '', texto)
        texto = re.sub(r'(?i)\.mp3', '', texto)
        texto = re.sub(r'(?i)(www\.|http)[^\s]+', '', texto)
        texto = re.sub(r'^\d+[_ -]+', '', texto)
        texto = re.sub(r'\[.*?\]', '', texto)
        texto = re.sub(r'\(.*?\)', '', texto)
        texto = texto.replace('_', ' ')
        return re.sub(r'\s+', ' ', texto).strip()

    @staticmethod
    def cerebro_ishkur(bpm, año, estilos, presencia_vocal, zcr, centroide):
        estilos_str = " ".join(estilos)
        
        if 1980 < año < 2011: return "Remember"
        if "eurodance" in estilos_str or "makina" in estilos_str or "happy hardcore" in estilos_str: return "Cantaditas"
        if presencia_vocal > 3000 and 130 <= bpm <= 145 and "vocal" in estilos_str: return "Cantaditas"
        if "trance" in estilos_str or "psy-trance" in estilos_str or (bpm >= 135 and centroide > 2500 and presencia_vocal < 2000): return "Trance"
        
        if "schranz" in estilos_str or "hard techno" in estilos_str or "industrial" in estilos_str: return "Techno" 
        if "melodic" in estilos_str or "progressive house" in estilos_str: return "Techno"
        if "tech house" in estilos_str: return "Tech House"
        if "house" in estilos_str and "tech" not in estilos_str: return "House"
        if "techno" in estilos_str: return "Techno"
        
        if bpm > 138 and zcr > 0.08: return "Techno"
        elif bpm > 128: return "Techno"
        else: return "Tech House"
