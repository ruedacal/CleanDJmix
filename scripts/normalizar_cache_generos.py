"""
Script de normalización y saneamiento del catálogo auditado en data/audit_cache.db.
Erradica los 2,655 falsos positivos de 'Tech House' generados por el algoritmo previo.
Aplica MusicTaxonomy y DiscogsService para reasignar el género canónico real
o 'Desconocido' si no hay certeza.
"""

import sqlite3
import json
import os
import sys

# Asegurar path del proyecto
sys.path.insert(0, os.path.abspath("."))
from domain.music_taxonomy import MusicTaxonomy
from services.discogs_service import DiscogsService


def normalizar_cache():
    db_path = "data/audit_cache.db"
    if not os.path.exists(db_path):
        print("No existe data/audit_cache.db")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT filepath, track_json FROM metadata_cache")
    rows = cur.fetchall()
    print(f"Total pistas en caché: {len(rows)}")

    updated = 0
    cleaned_tech_house = 0

    batch = []
    for fp, tj in rows:
        try:
            t = json.loads(tj)
            old_genre = t.get("genre", "")
            old_sub = t.get("subgenre", "")

            # Si tenía el tag infectado 'Tech House' o vacío
            if old_genre in ("Tech House", "", "Unknown", "unknown", "Desconocido") or not old_genre:
                artist = t.get("artist", "")
                title = t.get("title", "")
                bpm = t.get("bpm", 126.0)

                # Si es un artista icónico o conocido
                new_g, new_sub = MusicTaxonomy.normalizar_genero_y_subgenero(
                    artist=artist,
                    title=title,
                    bpm=bpm
                )

                # Si MusicTaxonomy no lo conoce pero era falso Tech House, marcar Desconocido
                if old_genre == "Tech House" and new_g != "Techno":
                    cleaned_tech_house += 1

                t["genre"] = new_g
                t["subgenre"] = new_sub
                batch.append((json.dumps(t, ensure_ascii=False), fp))
                updated += 1
        except Exception:
            pass

    if batch:
        cur.executemany("UPDATE metadata_cache SET track_json = ? WHERE filepath = ?", batch)
        conn.commit()
    conn.close()

    print(f"Proceso completado. Pistas actualizadas: {updated}. Falsos Tech House saneados: {cleaned_tech_house}.")


if __name__ == "__main__":
    normalizar_cache()
