import os
from typing import List, Dict, Any, Optional, Callable

class SpotifyDownloadService:
    """Servicio de aplicacion para escanear, descargar y posprocesar pistas de Spotify."""

    def __init__(self, downloader_adapter=None, taxonomy_service=None):
        if downloader_adapter is None:
            try:
                from infrastructure.spotify_adapter import SpotifyDownloaderAdapter
                self.adapter = SpotifyDownloaderAdapter
            except ImportError:
                self.adapter = None
        else:
            self.adapter = downloader_adapter

        self.taxonomy_service = taxonomy_service

    def escanear_enlace(self, url: str, callback_log: Optional[Callable[[str, str], None]] = None) -> List[Dict[str, Any]]:
        """Valida y obtiene la lista de pistas para seleccion previa."""
        url_limpia = (url or "").strip()
        if not url_limpia:
            if callback_log:
                callback_log("[!] URL vacia proporcionada.", "error")
            return []

        if callback_log:
            callback_log(f"[Spotify Service] Escaneando origen: {url_limpia}...", "info")

        if self.adapter is None:
            if callback_log:
                callback_log("[Spotify Service] Error: Adaptador de descarga no disponible en el sistema.", "error")
            return []

        try:
            pistas = self.adapter.escanear_lista(url_limpia, callback_log=callback_log)
            if callback_log:
                callback_log(f"[Spotify Service] Encontradas {len(pistas)} pistas disponibles.", "success")
            return pistas
        except Exception as e:
            if callback_log:
                callback_log(f"[Spotify Service] Error durante el escaneo: {e}", "error")
            return []

    def descargar_seleccion(
        self,
        canciones: List[Any],
        directorio_destino: str,
        callback_log: Optional[Callable[[str, str], None]] = None,
        auto_clasificar: bool = False,
        config_destinos: Optional[Dict] = None,
        modo_seguro: bool = False
    ) -> List[str]:
        """Descarga pistas seleccionadas y opcionalmente las procesa con TaxonomyService."""
        if not canciones:
            if callback_log:
                callback_log("[!] No hay pistas seleccionadas para descargar.", "error")
            return []

        if not directorio_destino or not os.path.exists(directorio_destino):
            if callback_log:
                callback_log(f"[!] Directorio de destino invalido o inexistente: {directorio_destino}", "error")
            return []

        if self.adapter is None:
            if callback_log:
                callback_log("[!] Adaptador de descarga no inicializado.", "error")
            return []

        if callback_log:
            callback_log(f"[Spotify Service] Iniciando descarga de {len(canciones)} pistas...", "info")

        archivos_descargados = self.adapter.descargar_canciones_seleccionadas(
            canciones,
            directorio_destino,
            callback_log=callback_log
        )

        if not archivos_descargados:
            if callback_log:
                callback_log("[!] La descarga no produjo nuevos archivos.", "error")
            return []

        if callback_log:
            callback_log(f"[Spotify Service] Descarga finalizada: {len(archivos_descargados)} archivos listos.", "success")

        if auto_clasificar and self.taxonomy_service:
            if callback_log:
                callback_log("[Spotify Service] Iniciando clasificacion automatica con TaxonomyService...", "info")

            for ruta_mp3 in archivos_descargados:
                nombre_base = os.path.splitext(os.path.basename(ruta_mp3))[0]
                partes = nombre_base.split(" - ", 1)
                artista = partes[0].strip() if len(partes) > 1 else "Unknown"
                titulo = partes[1].strip() if len(partes) > 1 else nombre_base

                try:
                    self.taxonomy_service.organizar_pista(
                        ruta_origen=ruta_mp3,
                        artista=artista,
                        titulo=titulo,
                        bpm=128,
                        año=2026,
                        genero="Techno",
                        subgenero="Peak Time / Driving",
                        ruta_base=directorio_destino,
                        modo_seguro=modo_seguro,
                        config_destinos=config_destinos,
                        mover_archivo=True
                    )
                except Exception as ex_tax:
                    if callback_log:
                        callback_log(f"[!] Error auto-clasificando {ruta_mp3}: {ex_tax}", "error")

        return archivos_descargados
