"""
Lector de Bibliotecas y Bases de Datos de Preparación DJ (Clean-Room).
Soporta lectura directa sin bloqueo y en modo solo lectura de:
- Pioneer Rekordbox (master.db SQLite / rekordbox.xml)
- Serato DJ Pro (database V2 / session logs en ~/Music/_Serato_/)
- Native Instruments Traktor (collection.nml)
- VirtualDJ Pro (database.xml)
"""

import os
import sqlite3
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Any
from domain.music_taxonomy import MusicTaxonomy


class LibraryReader:

    @staticmethod
    def detectar_rutas_locales() -> Dict[str, Optional[str]]:
        """Detecta las rutas estándar de bibliotecas DJ en macOS y Windows."""
        home = os.path.expanduser("~")
        rutas = {
            "rekordbox_db": None,
            "rekordbox_xml": None,
            "serato_dir": None,
            "traktor_nml": None,
            "virtualdj_db": None
        }

        # 1. Rekordbox
        rb_candidates = [
            os.path.join(home, "Library", "Pioneer", "rekordbox", "master.db"),
            os.path.join(home, "Library", "Application Support", "Pioneer", "rekordbox6", "master.db"),
            os.path.join(home, "AppData", "Roaming", "Pioneer", "rekordbox", "master.db")
        ]
        for r in rb_candidates:
            if os.path.exists(r):
                rutas["rekordbox_db"] = r
                break

        # 2. Serato
        serato_candidates = [
            os.path.join(home, "Music", "_Serato_"),
            os.path.join(home, "Musica", "_Serato_")
        ]
        for s in serato_candidates:
            if os.path.exists(s):
                rutas["serato_dir"] = s
                break

        # 3. Traktor
        traktor_docs = os.path.join(home, "Documents", "Native Instruments")
        if os.path.exists(traktor_docs):
            for d in os.listdir(traktor_docs):
                if d.startswith("Traktor"):
                    nml = os.path.join(traktor_docs, d, "collection.nml")
                    if os.path.exists(nml):
                        rutas["traktor_nml"] = nml
                        break

        # 4. VirtualDJ
        vdj_xml = os.path.join(home, "Documents", "VirtualDJ", "database.xml")
        if os.path.exists(vdj_xml):
            rutas["virtualdj_db"] = vdj_xml

        return rutas

    @classmethod
    def leer_rekordbox_tracks(cls, db_path: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lee metadatos de pistas desde Rekordbox SQLite (en modo solo lectura URI)."""
        if not db_path or not os.path.exists(db_path):
            return []
        tracks = []
        try:
            uri = f"file:{db_path}?mode=ro"
            conn = sqlite3.connect(uri, uri=True, timeout=5)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            query = """
                SELECT ID, Title, Artist, BPM, Key, Genre, Duration, FilePath 
                FROM djmdContent 
                ORDER BY ID DESC LIMIT 100
            """
            for row in cur.execute(query):
                raw_bpm = row["BPM"] or 12600
                bpm = round(raw_bpm / 100.0, 2) if raw_bpm > 500 else float(raw_bpm)
                g, sub = MusicTaxonomy.normalizar_genero_y_subgenero(
                    raw_genre=row["Genre"],
                    artist=row["Artist"],
                    title=row["Title"],
                    bpm=bpm
                )
                tracks.append({
                    "id": row["ID"],
                    "title": row["Title"] or "Sin título",
                    "artist": row["Artist"] or "Desconocido",
                    "bpm": bpm,
                    "key": row["Key"] or "8A",
                    "genre": g,
                    "subgenre": sub,
                    "duration": row["Duration"] or 0,
                    "filepath": row["FilePath"] or ""
                })
            conn.close()
        except Exception:
            pass
        return tracks

    @classmethod
    def leer_traktor_tracks(cls, nml_path: Optional[str] = None) -> List[Dict[str, Any]]:
        """Parsea metadatos de pistas de Traktor collection.nml."""
        if not nml_path or not os.path.exists(nml_path):
            return []
        tracks = []
        try:
            tree = ET.parse(nml_path)
            root = tree.getroot()
            collection = root.find("COLLECTION")
            if collection is not None:
                for entry in collection.findall("ENTRY")[:100]:
                    title = entry.get("TITLE", "Sin título")
                    artist = entry.get("ARTIST", "Desconocido")
                    bpm = 126.0
                    tempo = entry.find("TEMPO")
                    if tempo is not None:
                        try:
                            bpm = round(float(tempo.get("BPM", 126.0)), 2)
                        except Exception:
                            pass
                    info = entry.find("INFO")
                    key = "8A"
                    genre = "Desconocido"
                    if info is not None:
                        key = info.get("KEY", "8A")
                        genre = info.get("GENRE", "Desconocido")

                    g, sub = MusicTaxonomy.normalizar_genero_y_subgenero(
                        raw_genre=genre,
                        artist=artist,
                        title=title,
                        bpm=bpm
                    )
                    tracks.append({
                        "title": title,
                        "artist": artist,
                        "bpm": bpm,
                        "key": key,
                        "genre": g,
                        "subgenre": sub
                    })
        except Exception:
            pass
        return tracks
