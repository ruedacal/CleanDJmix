"""
Taxonomía Canónica Universal de Música para BeatWave DJ_MetaTagger.
Define la matriz simplificada de familias de música electrónica (máximo 5 subgéneros por familia,
con 'Tech House' ubicado bajo la familia 'Techno'), los géneros macro no electrónicos,
y las reglas de normalización estricta.

REGLA DE ORO: Si no hay certeza comprobada mediante tags de archivo, catálogo de huellas
o análisis semántico/acústico inequívoco, se asigna ESTRICTAMENTE 'Desconocido'.
Jamás inventar géneros por BPM ni usar 'Tech House' como fallback.
"""

from typing import Tuple, List, Dict, Optional
import re


class MusicTaxonomy:
    # 1. Matriz de Familias Electrónicas (Máximo 5 subgéneros canónicos por familia)
    ELECTRONIC_TAXONOMY: Dict[str, List[str]] = {
        "Techno": [
            "Tech House",
            "Hard Techno",
            "Industrial Techno",
            "Minimal Techno",
            "Detroit / Peak-Time"
        ],
        "House": [
            "Deep House",
            "Afro House",
            "Progressive House",
            "Electro House",
            "Classic House / Garage"
        ],
        "Trance": [
            "Psy-Trance",
            "Uplifting Trance",
            "Progressive Trance",
            "Vocal Trance",
            "Hard Trance"
        ],
        "Drum & Bass": [
            "Liquid Drum & Bass",
            "Neurofunk",
            "Jump Up",
            "Jungle",
            "Breakcore"
        ],
        "Hard Dance": [
            "Hardstyle",
            "Rawstyle",
            "Hardcore / Gabber",
            "Frenchcore",
            "Makina"
        ],
        "Bass Music": [
            "Dubstep / Brostep",
            "Melodic Dubstep",
            "Riddim",
            "Trap (EDM)",
            "Future Bass"
        ],
        "Breakbeat": [
            "Big Beat",
            "Nu Skool Breaks",
            "Electro Breaks",
            "Breakbeat Hardcore",
            "Florida Breaks"
        ],
        "Downtempo & Synth": [
            "Synthwave",
            "Trip Hop",
            "IDM",
            "Chillout / Ambient",
            "Vaporwave"
        ],
        "Disco & Dance": [
            "Nu-Disco",
            "Italo Disco",
            "Eurodance",
            "French House",
            "Hi-NRG"
        ]
    }

    # 2. Géneros Macro No Electrónicos (Sin subgéneros forzados)
    NON_ELECTRONIC_GENRES: List[str] = [
        "Pop",
        "Rock",
        "Flamenco",
        "Reggaeton / Urbano",
        "Hip Hop / Rap",
        "R&B / Soul / Funk",
        "Latin & Tropical",
        "Jazz & Blues",
        "Metal",
        "Clásica & BSO",
        "Reggae & Dub"
    ]

    # Diccionario de normalización para Discogs / ID3 / Tags externos
    STYLE_MAPPING: Dict[str, Tuple[str, str]] = {
        # TECHNO (con Tech House integrado)
        "tech house": ("Techno", "Tech House"),
        "tech-house": ("Techno", "Tech House"),
        "techhouse": ("Techno", "Tech House"),
        "hard techno": ("Techno", "Hard Techno"),
        "hardtechno": ("Techno", "Hard Techno"),
        "schranz": ("Techno", "Hard Techno"),
        "industrial techno": ("Techno", "Industrial Techno"),
        "dark techno": ("Techno", "Industrial Techno"),
        "minimal techno": ("Techno", "Minimal Techno"),
        "detroit techno": ("Techno", "Detroit / Peak-Time"),
        "peak time techno": ("Techno", "Detroit / Peak-Time"),
        "peak-time techno": ("Techno", "Detroit / Peak-Time"),
        "melodic techno": ("Techno", "Detroit / Peak-Time"),
        "raw techno": ("Techno", "Detroit / Peak-Time"),
        "acid techno": ("Techno", "Industrial Techno"),
        "techno": ("Techno", "Detroit / Peak-Time"),

        # HOUSE
        "deep house": ("House", "Deep House"),
        "deep-house": ("House", "Deep House"),
        "afro house": ("House", "Afro House"),
        "afro-house": ("House", "Afro House"),
        "amapiano": ("House", "Afro House"),
        "progressive house": ("House", "Progressive House"),
        "prog house": ("House", "Progressive House"),
        "electro house": ("House", "Electro House"),
        "classic house": ("House", "Classic House / Garage"),
        "garage house": ("House", "Classic House / Garage"),
        "uk garage": ("House", "Classic House / Garage"),
        "garage": ("House", "Classic House / Garage"),
        "house": ("House", "Classic House / Garage"),
        "acid house": ("House", "Electro House"),
        "tribal house": ("House", "Afro House"),
        "future house": ("House", "Electro House"),

        # TRANCE
        "psy-trance": ("Trance", "Psy-Trance"),
        "psytrance": ("Trance", "Psy-Trance"),
        "goa": ("Trance", "Psy-Trance"),
        "uplifting trance": ("Trance", "Uplifting Trance"),
        "progressive trance": ("Trance", "Progressive Trance"),
        "vocal trance": ("Trance", "Vocal Trance"),
        "hard trance": ("Trance", "Hard Trance"),
        "tech trance": ("Trance", "Hard Trance"),
        "trance": ("Trance", "Uplifting Trance"),

        # DRUM & BASS
        "liquid drum and bass": ("Drum & Bass", "Liquid Drum & Bass"),
        "liquid drum & bass": ("Drum & Bass", "Liquid Drum & Bass"),
        "liquid funk": ("Drum & Bass", "Liquid Drum & Bass"),
        "liquid dnb": ("Drum & Bass", "Liquid Drum & Bass"),
        "neurofunk": ("Drum & Bass", "Neurofunk"),
        "jump up": ("Drum & Bass", "Jump Up"),
        "jump-up": ("Drum & Bass", "Jump Up"),
        "jungle": ("Drum & Bass", "Jungle"),
        "ragga jungle": ("Drum & Bass", "Jungle"),
        "breakcore": ("Drum & Bass", "Breakcore"),
        "drum & bass": ("Drum & Bass", "Liquid Drum & Bass"),
        "drum and bass": ("Drum & Bass", "Liquid Drum & Bass"),
        "dnb": ("Drum & Bass", "Liquid Drum & Bass"),

        # HARD DANCE
        "hardstyle": ("Hard Dance", "Hardstyle"),
        "rawstyle": ("Hard Dance", "Rawstyle"),
        "hardcore": ("Hard Dance", "Hardcore / Gabber"),
        "gabber": ("Hard Dance", "Hardcore / Gabber"),
        "frenchcore": ("Hard Dance", "Frenchcore"),
        "makina": ("Hard Dance", "Makina"),
        "máquina": ("Hard Dance", "Makina"),
        "happy hardcore": ("Hard Dance", "Hardcore / Gabber"),

        # BASS MUSIC
        "dubstep": ("Bass Music", "Dubstep / Brostep"),
        "brostep": ("Bass Music", "Dubstep / Brostep"),
        "melodic dubstep": ("Bass Music", "Melodic Dubstep"),
        "riddim": ("Bass Music", "Riddim"),
        "trap (edm)": ("Bass Music", "Trap (EDM)"),
        "edm trap": ("Bass Music", "Trap (EDM)"),
        "future bass": ("Bass Music", "Future Bass"),

        # BREAKBEAT
        "big beat": ("Breakbeat", "Big Beat"),
        "nu skool breaks": ("Breakbeat", "Nu Skool Breaks"),
        "breaks": ("Breakbeat", "Nu Skool Breaks"),
        "breakbeat": ("Breakbeat", "Nu Skool Breaks"),
        "electro breaks": ("Breakbeat", "Electro Breaks"),
        "breakbeat hardcore": ("Breakbeat", "Breakbeat Hardcore"),
        "florida breaks": ("Breakbeat", "Florida Breaks"),

        # DOWNTEMPO & SYNTH
        "synthwave": ("Downtempo & Synth", "Synthwave"),
        "retrowave": ("Downtempo & Synth", "Synthwave"),
        "trip hop": ("Downtempo & Synth", "Trip Hop"),
        "trip-hop": ("Downtempo & Synth", "Trip Hop"),
        "idm": ("Downtempo & Synth", "IDM"),
        "ambient": ("Downtempo & Synth", "Chillout / Ambient"),
        "chillout": ("Downtempo & Synth", "Chillout / Ambient"),
        "chill out": ("Downtempo & Synth", "Chillout / Ambient"),
        "downtempo": ("Downtempo & Synth", "Chillout / Ambient"),
        "vaporwave": ("Downtempo & Synth", "Vaporwave"),

        # DISCO & DANCE
        "nu-disco": ("Disco & Dance", "Nu-Disco"),
        "nu disco": ("Disco & Dance", "Nu-Disco"),
        "italo-disco": ("Disco & Dance", "Italo Disco"),
        "italo disco": ("Disco & Dance", "Italo Disco"),
        "eurodance": ("Disco & Dance", "Eurodance"),
        "euro-dance": ("Disco & Dance", "Eurodance"),
        "french house": ("Disco & Dance", "French House"),
        "french touch": ("Disco & Dance", "French House"),
        "hi-nrg": ("Disco & Dance", "Hi-NRG"),
        "disco": ("Disco & Dance", "Nu-Disco"),

        # NO ELECTRÓNICOS -> Asignan Género Macro, Subgénero="Desconocido"
        "pop": ("Pop", "Desconocido"),
        "dance-pop": ("Pop", "Desconocido"),
        "synth-pop": ("Pop", "Desconocido"),
        "new wave": ("Pop", "Desconocido"),
        "coldwave": ("Pop", "Desconocido"),
        "rock": ("Rock", "Desconocido"),
        "indie rock": ("Rock", "Desconocido"),
        "alternative rock": ("Rock", "Desconocido"),
        "hard rock": ("Rock", "Desconocido"),
        "punk": ("Rock", "Desconocido"),
        "flamenco": ("Flamenco", "Desconocido"),
        "rumba": ("Flamenco", "Desconocido"),
        "nuevo flamenco": ("Flamenco", "Desconocido"),
        "reggaeton": ("Reggaeton / Urbano", "Desconocido"),
        "reggaetón": ("Reggaeton / Urbano", "Desconocido"),
        "trap latino": ("Reggaeton / Urbano", "Desconocido"),
        "dembow": ("Reggaeton / Urbano", "Desconocido"),
        "urbano latino": ("Reggaeton / Urbano", "Desconocido"),
        "hip hop": ("Hip Hop / Rap", "Desconocido"),
        "hip-hop": ("Hip Hop / Rap", "Desconocido"),
        "rap": ("Hip Hop / Rap", "Desconocido"),
        "boom bap": ("Hip Hop / Rap", "Desconocido"),
        "r&b": ("R&B / Soul / Funk", "Desconocido"),
        "soul": ("R&B / Soul / Funk", "Desconocido"),
        "funk": ("R&B / Soul / Funk", "Desconocido"),
        "boogie": ("R&B / Soul / Funk", "Desconocido"),
        "new jack swing": ("R&B / Soul / Funk", "Desconocido"),
        "salsa": ("Latin & Tropical", "Desconocido"),
        "bachata": ("Latin & Tropical", "Desconocido"),
        "merengue": ("Latin & Tropical", "Desconocido"),
        "cumbia": ("Latin & Tropical", "Desconocido"),
        "jazz": ("Jazz & Blues", "Desconocido"),
        "blues": ("Jazz & Blues", "Desconocido"),
        "metal": ("Metal", "Desconocido"),
        "heavy metal": ("Metal", "Desconocido"),
        "classical": ("Clásica & BSO", "Desconocido"),
        "clásica": ("Clásica & BSO", "Desconocido"),
        "soundtrack": ("Clásica & BSO", "Desconocido"),
        "reggae": ("Reggae & Dub", "Desconocido"),
        "dub": ("Reggae & Dub", "Desconocido"),
        "dancehall": ("Reggae & Dub", "Desconocido")
    }

    # Artistas globales canónicos para desambiguación semántica directa
    ICONIC_ARTISTS: Dict[str, Tuple[str, str]] = {
        # Pop / R&B
        "michael jackson": ("Pop", "Desconocido"),
        "madonna": ("Pop", "Desconocido"),
        "the weeknd": ("Pop", "Desconocido"),
        "dua lipa": ("Pop", "Desconocido"),
        "bruno mars": ("R&B / Soul / Funk", "Desconocido"),
        "stevie wonder": ("R&B / Soul / Funk", "Desconocido"),
        "james brown": ("R&B / Soul / Funk", "Desconocido"),
        "saâda bonaire": ("Pop", "Desconocido"),
        "saada bonaire": ("Pop", "Desconocido"),

        # Flamenco
        "camarón": ("Flamenco", "Desconocido"),
        "camaron de la isla": ("Flamenco", "Desconocido"),
        "paco de lucía": ("Flamenco", "Desconocido"),
        "paco de lucia": ("Flamenco", "Desconocido"),
        "rosalía": ("Flamenco", "Desconocido"),
        "rosalia": ("Flamenco", "Desconocido"),
        "niña pastori": ("Flamenco", "Desconocido"),
        "ketama": ("Flamenco", "Desconocido"),

        # Reggaeton / Urbano
        "bad bunny": ("Reggaeton / Urbano", "Desconocido"),
        "daddy yankee": ("Reggaeton / Urbano", "Desconocido"),
        "don omar": ("Reggaeton / Urbano", "Desconocido"),
        "rauw alejandro": ("Reggaeton / Urbano", "Desconocido"),
        "j balvin": ("Reggaeton / Urbano", "Desconocido"),
        "anuel aa": ("Reggaeton / Urbano", "Desconocido"),

        # Hip Hop
        "2pac": ("Hip Hop / Rap", "Desconocido"),
        "tupac": ("Hip Hop / Rap", "Desconocido"),
        "notorious b.i.g.": ("Hip Hop / Rap", "Desconocido"),
        "eminem": ("Hip Hop / Rap", "Desconocido"),
        "kendrick lamar": ("Hip Hop / Rap", "Desconocido"),
        "drake": ("Hip Hop / Rap", "Desconocido"),

        # Rock / Metal
        "ac/dc": ("Rock", "Desconocido"),
        "queen": ("Rock", "Desconocido"),
        "nirvana": ("Rock", "Desconocido"),
        "metallica": ("Metal", "Desconocido"),
        "iron maiden": ("Metal", "Desconocido"),
        "arctic monkeys": ("Rock", "Desconocido"),

        # Techno (Iconos)
        "charlotte de witte": ("Techno", "Hard Techno"),
        "amelie lens": ("Techno", "Hard Techno"),
        "klangkuenstler": ("Techno", "Hard Techno"),
        "oscar mulero": ("Techno", "Industrial Techno"),
        "adam beyer": ("Techno", "Detroit / Peak-Time"),
        "enrico sangiuliano": ("Techno", "Detroit / Peak-Time"),
        "carl cox": ("Techno", "Detroit / Peak-Time"),
        "richie hawtin": ("Techno", "Minimal Techno"),
        "robert hood": ("Techno", "Minimal Techno"),
        "jeff mills": ("Techno", "Detroit / Peak-Time"),

        # Tech House (Iconos dentro de Techno)
        "fisher": ("Techno", "Tech House"),
        "chris lake": ("Techno", "Tech House"),
        "michael bibi": ("Techno", "Tech House"),
        "cloonee": ("Techno", "Tech House"),
        "pawsa": ("Techno", "Tech House"),
        "james hype": ("Techno", "Tech House"),
        "john summit": ("Techno", "Tech House"),
        "wade": ("Techno", "Tech House"),
        "dom dolla": ("Techno", "Tech House"),
        "solardo": ("Techno", "Tech House"),
        "dennis cruz": ("Techno", "Tech House"),
        "green velvet": ("Techno", "Tech House"),
        "patrick topping": ("Techno", "Tech House"),
        "jamie jones": ("Techno", "Tech House"),
        "paco osuna": ("Techno", "Tech House"),

        # House (Iconos)
        "black coffee": ("House", "Afro House"),
        "keinemusik": ("House", "Afro House"),
        "kerri chandler": ("House", "Deep House"),
        "larry heard": ("House", "Deep House"),
        "frankie knuckles": ("House", "Classic House / Garage"),
        "masters at work": ("House", "Classic House / Garage"),
        "david guetta": ("House", "Electro House"),
        "tiesto": ("House", "Electro House"),
        "avicii": ("House", "Progressive House"),
        "eric prydz": ("House", "Progressive House"),

        # Trance (Iconos)
        "armin van buuren": ("Trance", "Uplifting Trance"),
        "astrix": ("Trance", "Psy-Trance"),
        "infected mushroom": ("Trance", "Psy-Trance"),
        "paul van dyk": ("Trance", "Uplifting Trance"),
        "ferry corsten": ("Trance", "Uplifting Trance"),
        "above & beyond": ("Trance", "Progressive Trance"),

        # Drum & Bass (Iconos)
        "noisia": ("Drum & Bass", "Neurofunk"),
        "sub focus": ("Drum & Bass", "Liquid Drum & Bass"),
        "chase & status": ("Drum & Bass", "Jump Up"),
        "pendulum": ("Drum & Bass", "Liquid Drum & Bass"),
        "shy fx": ("Drum & Bass", "Jungle"),
        "andy c": ("Drum & Bass", "Jump Up"),

        # Hard Dance (Iconos)
        "headhunterz": ("Hard Dance", "Hardstyle"),
        "wildstylez": ("Hard Dance", "Hardstyle"),
        "angerfist": ("Hard Dance", "Hardcore / Gabber"),
        "sefa": ("Hard Dance", "Frenchcore"),
        "chimo bayo": ("Hard Dance", "Makina"),
        "pastis & buenri": ("Hard Dance", "Makina")
    }

    @classmethod
    def normalizar_genero_y_subgenero(
        cls,
        raw_genre: Optional[str] = None,
        raw_subgenre: Optional[str] = None,
        raw_styles: Optional[List[str]] = None,
        artist: Optional[str] = None,
        title: Optional[str] = None,
        bpm: Optional[float] = None
    ) -> Tuple[str, str]:
        """
        Resuelve y normaliza el Género y Subgénero bajo la taxonomía canónica.
        Prioridad determinista:
        1. Artistas icónicos globales indubitables (Michael Jackson -> Pop, Paco de Lucía -> Flamenco, etc.).
        2. Estilos específicos extraídos de Discogs / Tags (e.g. 'Tech House', 'Hard Techno', 'Flamenco').
        3. Géneros de contenedor (ID3 / FLAC / MP4) si son específicos.
        4. Cero fallbacks ciegos: Si no hay certeza comprobada -> ("Desconocido", "Desconocido").
        """
        artist_clean = str(artist or "").strip().lower()
        title_clean = str(title or "").strip().lower()
        raw_gen_clean = str(raw_genre or "").strip().lower()
        raw_sub_clean = str(raw_subgenre or "").strip().lower()

        styles_pool: List[str] = []
        if raw_styles:
            for s in raw_styles:
                if s:
                    styles_pool.append(str(s).strip().lower())
        if raw_sub_clean:
            styles_pool.append(raw_sub_clean)
        if raw_gen_clean:
            styles_pool.append(raw_gen_clean)

        # Tier 1: Comprobación semántica de Artistas Icónicos
        for art_key, (target_g, target_sub) in cls.ICONIC_ARTISTS.items():
            if art_key in artist_clean or art_key in title_clean:
                # Si el artista es icónico de un estilo pero styles_pool contiene un subgénero más específico
                for style_candidate in styles_pool:
                    if style_candidate in cls.STYLE_MAPPING:
                        mapped_g, mapped_sub = cls.STYLE_MAPPING[style_candidate]
                        if mapped_g == target_g:
                            return mapped_g, mapped_sub
                return target_g, target_sub

        # Tier 2: Mapeo de estilos y subgéneros específicos (Discogs Styles / ID3 Subgenres)
        for st in styles_pool:
            # Búsqueda exacta
            if st in cls.STYLE_MAPPING:
                return cls.STYLE_MAPPING[st]
            # Búsqueda de substring
            for pattern, (mapped_g, mapped_sub) in cls.STYLE_MAPPING.items():
                if pattern in st:
                    return mapped_g, mapped_sub

        # Tier 3: Comprobación de Géneros Macro directos
        for non_elec in cls.NON_ELECTRONIC_GENRES:
            if non_elec.lower() in raw_gen_clean or non_elec.lower() in styles_pool:
                return non_elec, "Desconocido"

        # Tier 4: Familias electrónicas generales
        for elec_fam in cls.ELECTRONIC_TAXONOMY.keys():
            if elec_fam.lower() in raw_gen_clean or elec_fam.lower() in styles_pool:
                # Si es Techno o House genérico sin subgénero conocido
                return elec_fam, "Desconocido"

        # TIER FINAL: NO SE INVENTA NADA
        return "Desconocido", "Desconocido"
