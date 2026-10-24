import os
import shutil
from typing import Dict, Any, Optional, Callable
from infrastructure.audio_adapter import AudioAdapter

TAXONOMIA_DJ = {
    "Techno": [
        "Peak Time / Driving",
        "Raw / Deep / Hypnotic",
        "Hard Techno / Industrial",
        "Melodic Techno",
        "Acid Techno"
    ],
    "House": [
        "Tech House",
        "Deep House",
        "Afro House",
        "Melodic / Progressive House",
        "Jackin / Funky House"
    ],
    "Trance": [
        "Uplifting Trance",
        "Psy-Trance",
        "Progressive Trance",
        "Tech Trance"
    ],
    "Drum & Bass": [
        "Liquid Drum & Bass",
        "Neurofunk",
        "Jump Up",
        "Dancefloor DnB"
    ],
    "Electro & Breaks": [
        "Breakbeat",
        "Electro House",
        "Minimal / Deep Tech",
        "UK Garage / 2-Step"
    ],
    "Downtempo": [
        "Organic House",
        "Chillout / Lounge",
        "Electronica"
    ],
    "Latin & Urban": [
        "Reggaetón",
        "Cachengue / RKT",
        "Cuarteto",
        "Cumbia",
        "Guaracha",
        "Latin House"
    ]
}

class TaxonomyService:
    """Gestiona la inyeccion de metadatos y la organizacion fisica de la biblioteca."""

    def __init__(self, audio_adapter=None):
        self.audio_adapter = audio_adapter or AudioAdapter

    @staticmethod
    def obtener_arbol_taxonomia() -> Dict[str, list]:
        """Devuelve el árbol jerárquico de géneros y subgéneros estándar para DJs."""
        return TAXONOMIA_DJ

    def resolver_ruta_destino(
        self,
        ruta_base: str,
        genero: str,
        subgenero: str,
        nombre_archivo: str,
        config_destinos: Optional[Dict[str, Dict[str, Dict[str, str]]]] = None
    ) -> str:
        """Determina la ruta absoluta final segun la taxonomía configurada."""
        carpeta_sub = subgenero
        dir_destino = ruta_base

        if config_destinos and genero in config_destinos and subgenero in config_destinos[genero]:
            cfg = config_destinos[genero][subgenero]
            carpeta_sub = cfg.get("carpeta", subgenero) or subgenero
            ruta_custom = cfg.get("ruta", "").strip()
            if ruta_custom and os.path.exists(ruta_custom):
                dir_destino = ruta_custom

        destino_final_dir = os.path.join(dir_destino, carpeta_sub)
        return os.path.join(destino_final_dir, nombre_archivo)

    def organizar_pista(
        self,
        ruta_origen: str,
        artista: str,
        titulo: str,
        bpm: int,
        año: int,
        genero: str,
        subgenero: str,
        ruta_base: str,
        modo_seguro: bool = False,
        config_destinos: Optional[Dict[str, Dict[str, Dict[str, str]]]] = None,
        mover_archivo: bool = True
    ) -> Dict[str, Any]:
        """Inyecta tags ID3 y reubica el archivo segun su taxonomía."""
        # 1. Inyectar tags ID3
        resultado_inyeccion = self.audio_adapter.actualizar_fichero(
            ruta_completa=ruta_origen,
            artista=artista,
            titulo=titulo,
            año=año,
            bpm=bpm,
            modo_seguro=modo_seguro
        )

        nombre_archivo = os.path.basename(resultado_inyeccion)
        if not nombre_archivo.lower().endswith(".mp3"):
            nombre_archivo = f"{artista} - {titulo}.mp3"

        # 2. Resolver destino fisico
        ruta_destino = self.resolver_ruta_destino(
            ruta_base=ruta_base,
            genero=genero,
            subgenero=subgenero,
            nombre_archivo=nombre_archivo,
            config_destinos=config_destinos
        )

        if modo_seguro:
            return {
                "estado": "Simulado (Modo Seguro)",
                "ruta_origen": ruta_origen,
                "ruta_destino": ruta_destino,
                "artista": artista,
                "titulo": titulo,
                "bpm": bpm
            }

        # 3. Traslado fisico en disco
        try:
            os.makedirs(os.path.dirname(ruta_destino), exist_ok=True)
            if os.path.abspath(ruta_origen) != os.path.abspath(ruta_destino):
                if mover_archivo:
                    shutil.move(ruta_origen, ruta_destino)
                else:
                    shutil.copy2(ruta_origen, ruta_destino)
            return {
                "estado": "OK",
                "ruta_origen": ruta_origen,
                "ruta_destino": ruta_destino,
                "artista": artista,
                "titulo": titulo,
                "bpm": bpm
            }
        except Exception as e:
            return {
                "estado": f"Error: {e}",
                "ruta_origen": ruta_origen,
                "ruta_destino": ruta_destino,
                "artista": artista,
                "titulo": titulo,
                "bpm": bpm
            }

    def organizar_lote(
        self,
        tracks: list,
        ruta_base: str,
        mover_archivo: bool = False,
        progreso_cb: Optional[Callable[[int, str], None]] = None
    ) -> Dict[str, Any]:
        """Organiza un lote de tracks copiándolos o moviéndolos a carpetas estructuradas
        según Género / Subgénero para Serato Crates o Rekordbox."""
        if not tracks or not isinstance(tracks, list):
            return {"status": "error", "msg": "Lista de pistas vacía", "procesados": 0}

        total = len(tracks)
        procesados = 0
        errores = 0
        rutas_finales = []

        if progreso_cb:
            progreso_cb(5, f"Iniciando ruteo de taxonomía para {total} pistas...")

        for idx, t in enumerate(tracks, 1):
            pct = int(5 + (idx / total) * 90)
            target_path = t.get("path") or t.get("f")
            if not target_path or not os.path.exists(target_path):
                errores += 1
                continue

            genero = str(t.get("genre") or "Tech House").strip()
            subgenero = str(t.get("subgenre") or "").strip()
            if not subgenero:
                if genero in TAXONOMIA_DJ and len(TAXONOMIA_DJ[genero]) > 0:
                    subgenero = TAXONOMIA_DJ[genero][0]
                else:
                    subgenero = "General"

            nombre_archivo = os.path.basename(target_path)
            destino_dir = os.path.join(ruta_base, genero, subgenero)
            destino_final = os.path.join(destino_dir, nombre_archivo)

            try:
                os.makedirs(destino_dir, exist_ok=True)
                if os.path.abspath(target_path) != os.path.abspath(destino_final):
                    if mover_archivo:
                        shutil.move(target_path, destino_final)
                    else:
                        shutil.copy2(target_path, destino_final)
                procesados += 1
                rutas_finales.append({
                    "origen": target_path,
                    "destino": destino_final,
                    "genero": genero,
                    "subgenero": subgenero
                })
            except Exception as e:
                print(f"[TAXONOMY ERROR] Fallo al enrutar {nombre_archivo}: {e}")
                errores += 1

            if progreso_cb and (total <= 25 or idx % max(1, total // 25) == 0 or idx == total):
                progreso_cb(pct, f"Organizando ({idx}/{total}): {genero}/{subgenero}")

        if progreso_cb:
            progreso_cb(100, f"Ruteo finalizado: {procesados} pistas organizadas.")

        return {
            "status": "ok",
            "total": total,
            "procesados": procesados,
            "errores": errores,
            "rutas": rutas_finales
        }

    def buscar_temas_unificado(
        self,
        query: str,
        ambito: str = "all",
        ruta_local: str = "/Users/admin/Music/mi musica",
        limite: int = 25
    ) -> Dict[str, Any]:
        """Busca pistas por taxonomía en la biblioteca local en disco y/o en el Record Pool Online."""
        query_limpia = (query or "").strip()
        resultados_locales = []
        resultados_online = []

        # 1. Búsqueda Local en disco (si ámbito es 'all' o 'local')
        if ambito in ("all", "local") and ruta_local and os.path.exists(ruta_local):
            q_lower = query_limpia.lower()
            terminos = [t for t in q_lower.split() if len(t) >= 2 and t not in ('para', 'con', 'del', 'the', 'los', 'las', 'por')]
            
            formatos_audio = ('.mp3', '.flac', '.aiff', '.wav', '.m4a')
            count = 0
            for root, _, files in os.walk(ruta_local):
                for f in files:
                    if f.lower().endswith(formatos_audio):
                        f_lower = f.lower()
                        root_lower = root.lower()
                        if not terminos or any(term in f_lower or term in root_lower for term in terminos):
                            full_path = os.path.join(root, f)
                            nombre_sin_ext = os.path.splitext(f)[0]
                            partes = nombre_sin_ext.split(" - ")
                            artista = partes[0].strip() if len(partes) > 1 else "Artista Local"
                            titulo = partes[1].strip() if len(partes) > 1 else nombre_sin_ext
                            
                            padre = os.path.basename(root)
                            abuelo = os.path.basename(os.path.dirname(root))
                            genero_sug = abuelo if abuelo in TAXONOMIA_DJ else "House"
                            subg_sug = padre if padre in TAXONOMIA_DJ.get(genero_sug, []) else "Tech House"

                            resultados_locales.append({
                                "id": f"local_{abs(hash(full_path))}",
                                "title": titulo,
                                "artist": artista,
                                "album": padre if padre != os.path.basename(ruta_local) else "Biblioteca Local",
                                "path": full_path,
                                "f": full_path,
                                "genre": genero_sug,
                                "subgenre": subg_sug,
                                "bpm": 128,
                                "key": "8A",
                                "version": "Extended Mix" if "extended" in f_lower else ("Intro" if "intro" in f_lower else "Original Mix"),
                                "mood": "Peak Time / Pista",
                                "is_local": True
                            })
                            count += 1
                            if count >= limite:
                                break
                if count >= limite:
                    break

        # 2. Búsqueda Online en Record Pool (si ámbito es 'all' o 'online')
        term_online = query_limpia if query_limpia else "Tech House Club"
        if ambito in ("all", "online") and term_online:
            import urllib.parse
            import urllib.request
            import ssl
            import json
            import re

            try:
                target_bpm = 128
                bpm_match = re.search(r'\b(1[0-9]{2}|[6-9][0-9])\s*(?:bpm)?\b', query_limpia.lower())
                if bpm_match:
                    try:
                        target_bpm = int(bpm_match.group(1))
                    except Exception:
                        pass
                
                target_key = "8A"
                key_match = re.search(r'\b(1[0-2]|[1-9])([abAB])\b', query_limpia)
                if key_match:
                    target_key = (key_match.group(1) + key_match.group(2)).upper()

                clean_term = re.sub(r'\b(a|en|para|la|el|bpm|key)\b', '', term_online, flags=re.IGNORECASE).strip()
                if not clean_term:
                    clean_term = term_online

                q_encoded = urllib.parse.quote(clean_term)
                url = f"https://itunes.apple.com/search?term={q_encoded}&entity=song&limit={limite}"
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                
                with urllib.request.urlopen(req, context=ctx, timeout=6) as res:
                    data = json.loads(res.read().decode('utf-8'))
                    items = data.get("results", [])
                    for it in items:
                        t_name = it.get("trackName", "")
                        a_name = it.get("artistName", "")
                        raw_genre = it.get("primaryGenreName", "Electronic")
                        cover = (it.get("artworkUrl100") or "").replace("100x100bb", "600x600bb")
                        year = str(it.get("releaseDate") or "2024")[:4]

                        v = "Original Mix"
                        t_lower = t_name.lower()
                        if "extended" in t_lower:
                            v = "Extended Mix"
                        elif "intro" in t_lower or "outro" in t_lower:
                            v = "Intro / Outro"
                        elif "mashup" in t_lower or "bootleg" in t_lower:
                            v = "Mashup / Bootleg"
                        elif "remix" in t_lower or "club" in t_lower:
                            v = "Remix / Club Mix"
                        elif "acapella" in t_lower:
                            v = "Acapella"

                        resultados_online.append({
                            "id": f"online_{it.get('trackId')}",
                            "title": t_name,
                            "artist": a_name,
                            "album": it.get("collectionName", ""),
                            "genre": "Latin & Urban" if any(w in (t_lower + raw_genre.lower()) for w in ['reggaeton', 'reggaetón', 'cachengue', 'rkt', 'guaracha', 'cuarteto']) else ("Techno" if "techno" in (t_lower + raw_genre.lower()) else "House"),
                            "subgenre": "Tech House" if "tech" in t_lower else ("Afro House" if "afro" in t_lower else raw_genre),
                            "bpm": target_bpm,
                            "key": target_key,
                            "version": v,
                            "mood": "Peak Time / Pista",
                            "year": year,
                            "cover": cover,
                            "preview_url": it.get("previewUrl"),
                            "is_online": True,
                            "itunes_url": it.get("trackViewUrl")
                        })
            except Exception as e:
                print(f"[TAXONOMY POOL WARN] Error buscando en pool online: {e}")

        return {
            "status": "ok",
            "query": query_limpia,
            "ambito": ambito,
            "total_local": len(resultados_locales),
            "total_online": len(resultados_online),
            "total": len(resultados_locales) + len(resultados_online),
            "locales": resultados_locales,
            "online": resultados_online
        }
