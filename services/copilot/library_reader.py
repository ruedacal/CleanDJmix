"""
Lector de Bibliotecas y Bases de Datos de Preparación DJ (Clean-Room & Zero-Cost).
Soporta lectura directa sin bloqueo y en modo solo lectura de:
- Pioneer Rekordbox 6/7 (master.db con SQLCipher y clave universal / rekordbox.xml)
- Serato DJ Pro (.crate en ~/Music/_Serato_/Subcrates/ y metadatos ID3)
- Native Instruments Traktor (collection.nml)
- VirtualDJ Pro (database.xml)
"""

import os
import sqlite3
import struct
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Any

from domain.music_taxonomy import MusicTaxonomy
from services.copilot.dsp_cleanroom import DSPCleanRoomEngine

try:
    import sqlcipher3
    HAS_SQLCIPHER = True
except ImportError:
    HAS_SQLCIPHER = False

try:
    import mutagen
    from mutagen.id3 import ID3
    HAS_MUTAGEN = True
except ImportError:
    HAS_MUTAGEN = False


class LibraryReader:
    # Clave criptográfica universal estática documentada para Rekordbox 6 / 7 SQLCipher
    REKORDBOX_SQLCIPHER_KEY = "402fd482c38817c35ffa8ffb8c7d93143b749e7d315df7a81732a1ff43608497"

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
    def leer_rekordbox_tracks(cls, db_path: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Lee metadatos de pistas desde Rekordbox SQLite / SQLCipher en modo solo lectura.
        Extrae artista, título, BPM cuantizado, tonalidad Camelot, género normalizado y Hot Cues.
        """
        if not db_path or not os.path.exists(db_path):
            return []

        tracks = []
        conn = None

        # 1. Intento con SQLCipher (Rekordbox 6/7)
        if HAS_SQLCIPHER:
            try:
                conn = sqlcipher3.connect(db_path)
                cur = conn.cursor()
                cur.execute(f"PRAGMA key = '{cls.REKORDBOX_SQLCIPHER_KEY}';")
                # Comprobar que responde
                cur.execute("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1;")
            except Exception:
                if conn:
                    conn.close()
                conn = None

        # 2. Fallback a SQLite plano (Rekordbox 5 o USB exports)
        if not conn:
            try:
                uri = f"file:{db_path}?mode=ro"
                conn = sqlite3.connect(uri, uri=True, timeout=5)
            except Exception:
                return []

        try:
            if HAS_SQLCIPHER and isinstance(conn, sqlcipher3.Connection):
                conn.row_factory = sqlcipher3.Row
            else:
                conn.row_factory = sqlite3.Row
            cur = conn.cursor()

            query = f"""
                SELECT c.ID, c.Title, a.Name as Artist, c.BPM, k.ScaleName as KeyName, 
                       g.Name as Genre, c.FolderPath, c.Length
                FROM djmdContent c
                LEFT JOIN djmdArtist a ON c.ArtistID = a.ID
                LEFT JOIN djmdKey k ON c.KeyID = k.ID
                LEFT JOIN djmdGenre g ON c.GenreID = g.ID
                WHERE c.FolderPath NOT LIKE '%Sampler%'
                ORDER BY c.StockDate DESC, c.ID DESC
                LIMIT {limit};
            """

            for row in cur.execute(query):
                raw_bpm = row["BPM"] or 12600
                bpm = round(raw_bpm / 100.0, 2) if raw_bpm > 500 else float(raw_bpm)
                title = row["Title"] or "Sin título"
                artist = row["Artist"] or "Desconocido"
                raw_key = row["KeyName"] or "Am"
                camelot_key = DSPCleanRoomEngine.to_camelot(raw_key)

                g, sub = MusicTaxonomy.normalizar_genero_y_subgenero(
                    raw_genre=row["Genre"],
                    artist=artist,
                    title=title,
                    bpm=bpm
                )

                content_id = row["ID"]
                # Extraer Hot Cues de djmdCue si existen
                cues = []
                try:
                    c_cur = conn.cursor()
                    cue_query = "SELECT InMsec, Kind, Comment FROM djmdCue WHERE ContentID = ? ORDER BY InMsec ASC LIMIT 8"
                    for c_row in c_cur.execute(cue_query, (content_id,)):
                        cues.append({
                            "position_ms": c_row[0] or 0,
                            "kind": c_row[1] or 0,
                            "comment": c_row[2] or "Cue"
                        })
                except Exception:
                    pass

                tracks.append({
                    "id": content_id,
                    "title": title,
                    "artist": artist,
                    "bpm": bpm,
                    "key": camelot_key,
                    "key_name": raw_key,
                    "genre": g,
                    "subgenre": sub,
                    "duration": row["Length"] or 240,
                    "filepath": row["FolderPath"] or "",
                    "cues": cues
                })

            conn.close()
        except Exception:
            if conn:
                try:
                    conn.close()
                except Exception:
                    pass

        return tracks

    @classmethod
    def leer_serato_tracks(cls, serato_dir: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Lee metadatos de pistas desde los archivos de cajas (.crate) en ~/Music/_Serato_/Subcrates/
        y extrae metadatos ID3 (BPM, Key Camelot, Artista, Título) de los archivos locales.
        """
        if not serato_dir or not os.path.exists(serato_dir):
            return []

        subcrates_dir = os.path.join(serato_dir, "Subcrates")
        if not os.path.exists(subcrates_dir):
            return []

        home_music = os.path.expanduser("~/Music")
        track_paths = []

        try:
            for crate_file in os.listdir(subcrates_dir):
                if not crate_file.endswith(".crate"):
                    continue
                full_crate = os.path.join(subcrates_dir, crate_file)
                try:
                    with open(full_crate, "rb") as f:
                        raw = f.read()
                    idx = 0
                    while True:
                        idx = raw.find(b"otrk", idx)
                        if idx == -1 or idx + 8 > len(raw):
                            break
                        otrk_len = int.from_bytes(raw[idx+4:idx+8], "big")
                        inner = raw[idx+8:idx+8+otrk_len]
                        p_idx = inner.find(b"ptrk")
                        if p_idx != -1 and p_idx + 8 <= len(inner):
                            p_len = int.from_bytes(inner[p_idx+4:p_idx+8], "big")
                            p_val = inner[p_idx+8:p_idx+8+p_len]
                            rel = p_val.decode("utf-16-be", errors="ignore").rstrip("\x00")
                            candidate = os.path.join(home_music, rel)
                            if os.path.exists(candidate) and candidate not in track_paths:
                                track_paths.append(candidate)
                        idx += 8 + otrk_len
                except Exception:
                    continue
        except Exception:
            pass

        tracks = []
        for path in track_paths[:limit]:
            title = os.path.splitext(os.path.basename(path))[0]
            artist = "Desconocido"
            bpm = 126.0
            key = "8A"
            genre = "Desconocido"

            if HAS_MUTAGEN:
                try:
                    audio = ID3(path)
                    if audio.get("TIT2"):
                        title = str(audio.get("TIT2"))
                    if audio.get("TPE1"):
                        artist = str(audio.get("TPE1"))
                    if audio.get("TBPM"):
                        try:
                            bpm = round(float(str(audio.get("TBPM"))), 2)
                        except Exception:
                            pass
                    if audio.get("TKEY"):
                        key = DSPCleanRoomEngine.to_camelot(str(audio.get("TKEY")))
                    if audio.get("TCON"):
                        genre = str(audio.get("TCON"))
                except Exception:
                    pass

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
                "subgenre": sub,
                "filepath": path,
                "duration": 240
            })

        return tracks

    @classmethod
    def leer_traktor_tracks(cls, nml_path: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Parsea metadatos de pistas de Traktor collection.nml."""
        if not nml_path or not os.path.exists(nml_path):
            return []
        tracks = []
        try:
            tree = ET.parse(nml_path)
            root = tree.getroot()
            collection = root.find("COLLECTION")
            if collection is not None:
                for entry in collection.findall("ENTRY")[:limit]:
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
                    raw_key = "Am"
                    genre = "Desconocido"
                    if info is not None:
                        raw_key = info.get("KEY", "Am")
                        genre = info.get("GENRE", "Desconocido")

                    camelot_key = DSPCleanRoomEngine.to_camelot(raw_key)
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
                        "key": camelot_key,
                        "genre": g,
                        "subgenre": sub
                    })
        except Exception:
            pass
        return tracks
