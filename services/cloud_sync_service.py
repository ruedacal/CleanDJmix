"""
BEATWAVE PRO - Cloud Metadata Sync Service (Zero Audio Ingestion)
Almacena y sincroniza de forma ultraligera el estado de biblioteca, crates y metadatos
(<5 KB por pista) entre dispositivos (Web, Desktop, Móvil/Tablet) sin subir audio físico.
"""

import os
import json
import time
from typing import Dict, Any, Optional

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
SYNC_FILE = os.path.join(DATA_DIR, "library_sync_profile.json")

class CloudSyncService:
    @staticmethod
    def _ensure_dir():
        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR, exist_ok=True)

    @classmethod
    def push_sync(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Recibe y persiste el snapshot comprimido de metadatos del usuario."""
        cls._ensure_dir()
        
        library_name = payload.get("library_name", "Mi Biblioteca DJ")
        folders = payload.get("folders", [])
        tracks_metadata = payload.get("tracks_metadata", {})
        
        # Estructura ligera normalizada
        sync_package = {
            "version": 1,
            "library_name": library_name,
            "updated_at": time.time(),
            "updated_iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "total_folders": len(folders),
            "total_tracks": len(tracks_metadata),
            "folders": folders,
            "tracks_metadata": tracks_metadata
        }

        # Serialización compacta
        json_bytes = json.dumps(sync_package, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
        with open(SYNC_FILE, "wb") as f:
            f.write(json_bytes)

        size_kb = round(len(json_bytes) / 1024, 2)
        # Estimación de ahorro respecto a subir archivos de audio (asumiendo ~20MB promedio por track FLAC/WAV/MP3)
        audio_gb_saved = round((len(tracks_metadata) * 20) / 1024, 2)

        return {
            "status": "success",
            "message": "Metadatos sincronizados con éxito",
            "sync_version": sync_package["version"],
            "timestamp": sync_package["updated_at"],
            "total_folders": len(folders),
            "total_tracks": len(tracks_metadata),
            "payload_size_kb": size_kb,
            "audio_bandwidth_saved_gb": audio_gb_saved,
            "cloud_storage_cost_usd": 0.00
        }

    @classmethod
    def pull_sync(cls) -> Dict[str, Any]:
        """Obtiene el último snapshot de biblioteca y carpetas sincronizado."""
        cls._ensure_dir()
        if not os.path.exists(SYNC_FILE):
            return {
                "status": "empty",
                "message": "No hay sincronizaciones previas en la nube/servidor",
                "timestamp": None,
                "folders": [],
                "tracks_metadata": {}
            }

        try:
            with open(SYNC_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            return {
                "status": "success",
                "data": data
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error leyendo perfil sincronizado: {str(e)}",
                "folders": [],
                "tracks_metadata": {}
            }

    @classmethod
    def get_sync_status(cls) -> Dict[str, Any]:
        """Devuelve el estado de sincronización y métricas de ahorro."""
        cls._ensure_dir()
        if not os.path.exists(SYNC_FILE):
            return {
                "is_synced": False,
                "last_sync": None,
                "total_tracks": 0,
                "total_folders": 0,
                "payload_size_kb": 0.0
            }

        try:
            mtime = os.path.getmtime(SYNC_FILE)
            size_kb = round(os.path.getsize(SYNC_FILE) / 1024, 2)
            with open(SYNC_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            return {
                "is_synced": True,
                "last_sync": mtime,
                "last_sync_iso": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(mtime)),
                "total_tracks": data.get("total_tracks", 0),
                "total_folders": data.get("total_folders", 0),
                "payload_size_kb": size_kb,
                "zero_audio_ingestion": True
            }
        except Exception:
            return {
                "is_synced": False,
                "last_sync": None,
                "total_tracks": 0,
                "total_folders": 0,
                "payload_size_kb": 0.0
            }
