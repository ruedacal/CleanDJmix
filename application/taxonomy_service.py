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
