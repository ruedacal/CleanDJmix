import os
import shutil
from typing import Dict, Any, Optional, Callable
from infrastructure.audio_adapter import AudioAdapter

class TaxonomyService:
    """Gestiona la inyeccion de metadatos y la organizacion fisica de la biblioteca."""

    def __init__(self, audio_adapter=None):
        self.audio_adapter = audio_adapter or AudioAdapter

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
