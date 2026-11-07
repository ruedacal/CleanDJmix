import re
from typing import Dict, Any, Tuple

class TagSanitizerService:
    """
    Servicio profesional de higienización de metadatos de audio para DJs.
    Elimina spam promocional, estandariza colaboraciones (feat.), detecta y
    da formato oficial a variantes (Extended Mix, Radio Edit, Dub Mix, Acapella).
    """

    # Basura promocional común en pools (BPM Supreme, ZipDJ, DJCity, Beatport rips, etc.)
    PROMO_PATTERNS = [
        r'\[\s*(?:(?:free\s*(?:download|dl)|out\s*now|exclusive|promo|premiere|première|beatport|traxsource|juno)\s*)+\s*\]',
        r'\(\s*(?:(?:free\s*(?:download|dl)|out\s*now|exclusive|promo|premiere|première|beatport|traxsource|juno)\s*)+\s*\)',
        r'\[\s*(?:official\s*(?:music\s*)?video|official\s*audio|lyric\s*video|clip|hd|hq|4k|1080p)\s*\]',
        r'\(\s*(?:official\s*(?:music\s*)?video|official\s*audio|lyric\s*video|clip|hd|hq|4k|1080p)\s*\)',
        r'\[\s*(?:320\s*kbps|320|flac|wav|mp3|lossless|24bit|16bit)\s*\]',
        r'\(\s*(?:320\s*kbps|320|flac|wav|mp3|lossless|24bit|16bit)\s*\)',
        r'(?:www\.[a-z0-9\-\._]+\.[a-z]{2,5}\s*[-_–—]?\s*)',
        r'^(?:[a-z0-9\-\._]+\.(?:com|org|net|ru|to|mp3|io|cz|de)\s*[-_–—]\s*)',
        r'\s*[-_–—]\s*(?:www\.[a-z0-9\-\._]+\.[a-z]{2,5}|[a-z0-9\-\._]+\.(?:com|org|net|ru|to|io))\s*$',
    ]

    # Tipología de versiones DJ
    VERSION_KEYWORDS = [
        ("extended mix", "Extended Mix"),
        ("extended version", "Extended Mix"),
        ("extended", "Extended Mix"),
        ("original mix", "Original Mix"),
        ("club mix", "Club Mix"),
        ("dub mix", "Dub Mix"),
        ("dub", "Dub Mix"),
        ("radio edit", "Radio Edit"),
        ("radio mix", "Radio Edit"),
        ("short edit", "Radio Edit"),
        ("instrumental mix", "Instrumental"),
        ("instrumental", "Instrumental"),
        ("acapella", "Acapella"),
        ("a capella", "Acapella"),
        ("accapella", "Acapella"),
        ("vip mix", "VIP Mix"),
        ("vip edit", "VIP Mix"),
        ("vip", "VIP Mix"),
        ("remix", "Remix"),
        ("bootleg", "Bootleg"),
        ("clean edit", "Clean Edit"),
        ("dirty edit", "Dirty Edit"),
    ]

    @classmethod
    def extraer_tipo_version(cls, texto: str) -> str:
        """
        Detecta el tipo de versión DJ en base al título o nombre de archivo.
        Devuelve: 'extended', 'original', 'club', 'radio', 'dub', 'instrumental',
                  'acapella', 'vip', 'remix', 'clean', 'dirty' o 'standard'.
        """
        if not texto:
            return "standard"
        s = texto.lower()
        if "acapella" in s or "a capella" in s or "accapella" in s:
            return "acapella"
        if "instrumental" in s:
            return "instrumental"
        if "radio edit" in s or "radio mix" in s or "short edit" in s or "radio version" in s:
            return "radio"
        if "extended mix" in s or "extended version" in s or "extended edit" in s or re.search(r'\bextended\b', s):
            return "extended"
        if "club mix" in s or "club version" in s:
            return "club"
        if "dub mix" in s or "dub version" in s or re.search(r'\bdub\b', s):
            return "dub"
        if "vip mix" in s or "vip edit" in s or re.search(r'\bvip\b', s):
            return "vip"
        if "bootleg" in s:
            return "bootleg"
        if "original mix" in s or "original version" in s:
            return "original"
        if "remix" in s or "re-edit" in s or "reedit" in s or "rework" in s or "flip" in s:
            return "remix"
        if "clean" in s:
            return "clean"
        if "dirty" in s:
            return "dirty"
        # Detectar mezclas con nombre específico: "Wavesong Mix", "Moonman Mix", "Airwave Club Mix", etc.
        if re.search(r'[-–—\(\[\{]\s*[\w\s\.\']+\s+(?:mix|edit|version|dub|rmx)[\)\]\}]?', s):
            return "remix"
        return "standard"

    @classmethod
    def extraer_clave_version(cls, texto: str) -> str:
        """
        Genera una clave determinista única para la versión del track, distinguiendo entre
        remixes/edits específicos (p. ej. 'remix_space92' vs 'remix_frankeysandrino').
        """
        if not texto:
            return "standard"
        s = str(texto).lower().strip()
        
        # 1. Acapella
        if any(k in s for k in ["acapella", "a capella", "accapella"]):
            return "acapella"
        # 2. Instrumental
        if "instrumental" in s:
            return "instrumental"
        # 3. Radio / Short edit
        if any(k in s for k in ["radio edit", "radio mix", "short edit", "radio version"]):
            return "radio"
        # 4. Extended Mix / Version
        if any(k in s for k in ["extended mix", "extended version", "extended edit"]) or re.search(r'\bextended\b', s):
            return "extended"
        # 5. Club Mix
        if any(k in s for k in ["club mix", "club version"]):
            return "club"
        # 6. Dub Mix
        if any(k in s for k in ["dub mix", "dub version"]) or re.search(r'\bdub\b', s):
            return "dub"
        # 7. VIP
        if any(k in s for k in ["vip mix", "vip edit"]) or re.search(r'\bvip\b', s):
            return "vip"
        # 8. Bootleg
        if "bootleg" in s:
            return "bootleg"
        # 9. Original Mix
        if any(k in s for k in ["original mix", "original version"]):
            return "original"
        # 10. Intro / Outro / Live
        if any(k in s for k in ["intro version", "intro edit", "intro mix", "intro"]):
            return "intro"
        if any(k in s for k in ["outro version", "outro edit", "outro mix"]):
            return "outro"
        if "live" in s and any(k in s for k in ["live version", "live mix", "[live]", "(live)"]):
            return "live"

        # 11. Remix o versión específica nombrada
        m = re.search(r'[\(\[\{]([^\)\]\}]+)[\)\]\}]', texto)
        if not m:
            m = re.search(r'[-–—]\s*([^-\(\[\{]+)$', texto)

        if m:
            sub = m.group(1).strip()
            sub_l = sub.lower()
            if any(w in sub_l for w in ["remix", "re-edit", "reedit", "rework", "flip", "rmx", "version", "edit", "mix", "jam", "cut", "intro", "outro", "live", "dub"]):
                norm_sub = re.sub(r'\b(remix|re-edit|reedit|rework|flip|rmx|version|edit|mix|jam|cut|intro|outro|live|dub)\b', '', sub_l)
                norm_sub = re.sub(r'[^a-z0-9]', '', norm_sub)
                if norm_sub:
                    return f"remix_{norm_sub}"
                return "remix"

        if any(k in s for k in ["remix", "re-edit", "reedit", "rework", "flip"]):
            return "remix"

        return "standard"

    @classmethod
    def extraer_titulo_base(cls, texto: str) -> str:
        """Extrae el título nuclear de una canción eliminando variantes, remixers, paréntesis y corchetes."""
        if not texto:
            return ""
        s = str(texto).strip()
        # Eliminar contenido entre paréntesis, corchetes o llaves
        s = re.sub(r'[\(\[\{].*?[\)\]\}]', '', s)
        # Eliminar sufijos tras guión que sean remixes o versiones: ' - Chlär Remix', ' - Extended Mix', etc.
        s = re.sub(r'\s*[-–—]\s*.*?(?:remix|re-?edit|rework|mix|dub|vip|bootleg|version|edit|flip|rmx).*$', '', s, flags=re.IGNORECASE)
        # Eliminar palabras clave sueltas de versión
        for w in ['original mix', 'extended mix', 'club mix', 'dub mix', 'radio edit', 'radio mix', 'vip mix', 'remix']:
            s = re.sub(rf'\b{re.escape(w)}\b', '', s, flags=re.IGNORECASE)
        # Eliminar caracteres no alfanuméricos excepto espacios
        s = re.sub(r'[^a-zA-Z0-9\s]', '', s)
        s = re.sub(r'\s+', ' ', s).strip()
        return s

    @classmethod
    def limpiar_texto_promocional(cls, texto: str) -> str:
        """Elimina banners de descargas gratuitas, URLs y calidades entre corchetes."""
        if not texto:
            return ""
        limpio = str(texto).strip()
        for pat in cls.PROMO_PATTERNS:
            limpio = re.sub(pat, '', limpio, flags=re.IGNORECASE)
        # Limpiar espacios múltiples y caracteres sueltos
        limpio = re.sub(r'\s+', ' ', limpio).strip()
        limpio = re.sub(r'^\s*[-_–—]\s*', '', limpio)
        limpio = re.sub(r'\s*[-_–—]\s*$', '', limpio)
        return limpio

    @classmethod
    def estandarizar_feat(cls, texto: str) -> str:
        """Normaliza todas las variantes de 'featuring' a '(feat. X)' estándar."""
        if not texto:
            return ""
        s = texto.strip()
        # 1. Ya tiene paréntesis o corchetes: (ft. X) o [feat X]
        s = re.sub(r'[\(\[]\s*(?:feat\.?|ft\.?|featuring)\s+([^\)\]]+)[\)\]]', r'(feat. \1)', s, flags=re.IGNORECASE)
        
        # 2. Feat sin paréntesis: Artist ft Singer - Title
        def _repl(m):
            art = m.group(1).strip()
            return f"(feat. {art})"
        
        # Solo si no está ya precedido por paréntesis abierto
        s = re.sub(r'(?<!\()\b(?:feat\.?|ft\.?|featuring)\s+([A-Za-z0-9\s,&]+?)(?=\s*[-_–—\(\)\[\]]|$)', _repl, s, flags=re.IGNORECASE)
        
        # 3. Limpiar dobles paréntesis y espaciado
        s = re.sub(r'\(\s*\((.*?)\)\s*\)', r'(\1)', s)
        s = re.sub(r'\s+', ' ', s).strip()
        return s

    @classmethod
    def estandarizar_version_en_titulo(cls, titulo: str) -> Tuple[str, str]:
        """
        Detecta y formatea adecuadamente la versión al final del título con paréntesis estándar.
        Ej: "Losing It Extended Mix" -> ("Losing It (Extended Mix)", "Extended Mix")
        """
        if not titulo:
            return "", ""
        s = titulo.strip()
        version_detectada = ""

        # Comprobar si ya viene con paréntesis limpios
        m_paren = re.search(r'\(([^)]*(?:mix|edit|dub|acapella|instrumental|remix|bootleg|vip)[^)]*)\)$', s, flags=re.IGNORECASE)
        if m_paren:
            version_detectada = m_paren.group(1).strip()
            # Devolver tal cual con mayúsculas estándar
            return s, version_detectada

        # Comprobar sufijo sin paréntesis al final
        for kw_raw, kw_std in cls.VERSION_KEYWORDS:
            pat = r'(?:\s*[-_–—]\s*|\s+)' + re.escape(kw_raw) + r'\s*$'
            if re.search(pat, s, flags=re.IGNORECASE):
                base = re.sub(pat, '', s, flags=re.IGNORECASE).strip()
                s = f"{base} ({kw_std})"
                version_detectada = kw_std
                break

        return s, version_detectada

    @classmethod
    def sanitizar_track(cls, title: str, artist: str, album: str = "") -> Dict[str, Any]:
        """
        Aplica la suite completa de sanitización a un track:
        1. Limpieza de URLs y promos de pools.
        2. Normalización de feats.
        3. Formato limpio de versión DJ.
        4. Corrección de espaciado y mayúsculas.
        """
        original_title = str(title or "").strip()
        original_artist = str(artist or "").strip()
        original_album = str(album or "").strip()

        # 1. Limpieza promo
        t_clean = cls.limpiar_texto_promocional(original_title)
        a_clean = cls.limpiar_texto_promocional(original_artist)
        alb_clean = cls.limpiar_texto_promocional(original_album)

        # 2. Feat normalization
        t_clean = cls.estandarizar_feat(t_clean)
        a_clean = cls.estandarizar_feat(a_clean)

        # 3. Formato versión DJ
        t_clean, version_nombre = cls.estandarizar_version_en_titulo(t_clean)
        tipo_version = cls.extraer_tipo_version(t_clean)

        # 4. Limpieza final de guiones y espacios
        t_clean = re.sub(r'\s+', ' ', t_clean).strip()
        a_clean = re.sub(r'\s+', ' ', a_clean).strip()
        alb_clean = re.sub(r'\s+', ' ', alb_clean).strip()

        cambiado = (
            t_clean != original_title or
            a_clean != original_artist or
            alb_clean != original_album
        )

        return {
            "title": t_clean or original_title,
            "artist": a_clean or original_artist,
            "album": alb_clean or original_album,
            "version": version_nombre or ("Extended Mix" if tipo_version == "extended" else ""),
            "version_type": tipo_version,
            "cleaned": cambiado,
            "cambios": {
                "title_original": original_title,
                "title_nuevo": t_clean,
                "artist_original": original_artist,
                "artist_nuevo": a_clean
            } if cambiado else None
        }
