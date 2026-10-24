import os
import csv
import struct
import urllib.parse
import xml.etree.ElementTree as ET
from xml.dom import minidom
from typing import Dict, Any, List, Optional

class ExportService:
    """Gestiona la exportación de la biblioteca auditada a Excel/CSV, Serato Crates (.crate)
    y Rekordbox XML para importación directa en cabinas profesionales."""

    @staticmethod
    def generar_serato_crate_binario(file_paths: List[str]) -> bytes:
        """Construye la estructura binaria oficial de un archivo .crate de Serato ScratchLive / DJ Pro."""
        version = "1.0/Serato ScratchLive Crate"
        version_bytes = version.encode("utf-16-be")
        data = bytearray()

        # Bloque de versión: vrsn
        data.extend(b"vrsn")
        data.extend(struct.pack(">I", len(version_bytes)))
        data.extend(version_bytes)

        # Bloques de pista: otrk -> ptrk
        for p in file_paths:
            if not p:
                continue
            path_str = str(p)
            path_bytes = path_str.encode("utf-16-be")

            ptrk_data = bytearray()
            ptrk_data.extend(b"ptrk")
            ptrk_data.extend(struct.pack(">I", len(path_bytes)))
            ptrk_data.extend(path_bytes)

            data.extend(b"otrk")
            data.extend(struct.pack(">I", len(ptrk_data)))
            data.extend(ptrk_data)

        return bytes(data)

    def exportar_serato_crates(
        self,
        tracks: List[Dict[str, Any]],
        destino_serato_dir: Optional[str] = None
    ) -> Dict[str, Any]:
        """Exporta la biblioteca a archivos .crate en el directorio de Subcrates de Serato."""
        if not tracks or not isinstance(tracks, list):
            return {"status": "error", "msg": "No hay pistas cargadas para exportar crates."}

        if not destino_serato_dir:
            destino_serato_dir = os.path.expanduser("~/Music/_Serato_/Subcrates")

        try:
            os.makedirs(destino_serato_dir, exist_ok=True)
        except Exception as e:
            return {"status": "error", "msg": f"No se pudo crear directorio Serato: {e}"}

        # Agrupar pistas por Género y Subgénero
        por_genero = {}
        por_subgenero = {}
        todas_rutas = []

        for t in tracks:
            p = t.get("path") or t.get("f")
            if not p:
                continue
            todas_rutas.append(p)
            gen = str(t.get("genre") or "Tech House").strip()
            subg = str(t.get("subgenre") or "General").strip()

            if gen not in por_genero:
                por_genero[gen] = []
            por_genero[gen].append(p)

            clave_subg = f"{gen}%%{subg.replace('/', '-')}"
            if clave_subg not in por_subgenero:
                por_subgenero[clave_subg] = []
            por_subgenero[clave_subg].append(p)

        crates_creados = []

        # 1. Crate Maestro CleanDJmix
        master_bin = self.generar_serato_crate_binario(todas_rutas)
        master_path = os.path.join(destino_serato_dir, "CleanDJmix_Master.crate")
        with open(master_path, "wb") as f:
            f.write(master_bin)
        crates_creados.append(master_path)

        # 2. Crates por Género Raíz
        for gen, paths in por_genero.items():
            crate_bin = self.generar_serato_crate_binario(paths)
            c_name = f"{gen.replace('/', '-')}.crate"
            c_path = os.path.join(destino_serato_dir, c_name)
            with open(c_path, "wb") as f:
                f.write(crate_bin)
            crates_creados.append(c_path)

        # 3. Crates jerárquicos por Subgénero (Sintaxis Serato %%)
        for clave, paths in por_subgenero.items():
            crate_bin = self.generar_serato_crate_binario(paths)
            c_name = f"{clave}.crate"
            c_path = os.path.join(destino_serato_dir, c_name)
            with open(c_path, "wb") as f:
                f.write(crate_bin)
            crates_creados.append(c_path)

        return {
            "status": "ok",
            "total_crates": len(crates_creados),
            "total_pistas": len(todas_rutas),
            "destino": destino_serato_dir,
            "crates": [os.path.basename(c) for c in crates_creados]
        }

    def exportar_rekordbox_xml(
        self,
        tracks: List[Dict[str, Any]],
        destino_dir: str = "/Users/admin/Music/mi musica",
        nombre_archivo: str = "rekordbox.xml"
    ) -> Dict[str, Any]:
        """Genera un archivo rekordbox.xml estándar Pioneer DJ con metadatos completos y Hot Cues."""
        if not tracks or not isinstance(tracks, list):
            return {"status": "error", "msg": "No hay pistas cargadas para exportar rekordbox.xml."}

        try:
            os.makedirs(destino_dir, exist_ok=True)
            xml_path = os.path.join(destino_dir, nombre_archivo)

            root = ET.Element("DJ_PLAYLISTS", Version="1.0.0")
            ET.SubElement(root, "PRODUCT", Company="Pioneer DJ", Name="rekordbox", Version="6.0.0")

            valid_tracks = [t for t in tracks if (t.get("path") or t.get("f"))]
            collection_el = ET.SubElement(root, "COLLECTION", Entries=str(len(valid_tracks)))

            # Agrupación para el árbol de playlists
            arbol_playlists = {}

            for idx, t in enumerate(valid_tracks, 1):
                p = t.get("path") or t.get("f")
                title = t.get("title") or t.get("t") or os.path.splitext(os.path.basename(p))[0]
                artist = t.get("artist") or t.get("a") or "Desconocido"
                album = t.get("album") or ""
                bpm_val = t.get("bpm") or t.get("b") or "128.00"
                try:
                    bpm_str = f"{float(str(bpm_val).replace(',', '.')):.2f}"
                except Exception:
                    bpm_str = "128.00"

                key_val = t.get("key") or t.get("k") or ""
                comment = t.get("comment") or "Intro limpia 32b • Drop contundente • Outro 64b"
                gen = t.get("genre") or "Tech House"
                subg = t.get("subgenre") or "General"
                dur_str = t.get("duration") or "00:00"
                total_sec = 0
                try:
                    parts = dur_str.split(":")
                    if len(parts) == 2:
                        total_sec = int(parts[0]) * 60 + int(parts[1])
                except Exception:
                    total_sec = 180

                ext = os.path.splitext(p)[1].lower().replace(".", "")
                kind = "FLAC Audio" if ext == "flac" else ("AIFF File" if ext in ("aif", "aiff") else "MP3 File")

                loc_path = urllib.parse.quote(os.path.abspath(p))
                loc_uri = f"file://localhost{loc_path}"

                track_id = str(idx)
                track_el = ET.SubElement(
                    collection_el, "TRACK",
                    TrackID=track_id,
                    Name=str(title),
                    Artist=str(artist),
                    Album=str(album),
                    Genre=f"{gen} / {subg}" if subg and subg != "General" else str(gen),
                    Kind=kind,
                    TotalTime=str(total_sec),
                    AverageBpm=bpm_str,
                    Tonality=str(key_val),
                    Comments=str(comment),
                    Location=loc_uri,
                    BitRate="320",
                    SampleRate="44100"
                )

                # Hot Cues
                cues = t.get("cues") or []
                for c_idx, cue in enumerate(cues):
                    if not isinstance(cue, dict):
                        continue
                    c_name = cue.get("name") or f"Cue {c_idx+1}"
                    c_pct = float(cue.get("pct") or 0.0)
                    start_sec = max(0.0, c_pct * total_sec)
                    c_color = cue.get("color") or "#06b6d4"
                    r, g, b = 6, 182, 212
                    try:
                        if c_color.startswith("#") and len(c_color) == 7:
                            r = int(c_color[1:3], 16)
                            g = int(c_color[3:5], 16)
                            b = int(c_color[5:7], 16)
                    except Exception:
                        pass

                    ET.SubElement(
                        track_el, "POSITION_MARK",
                        Name=str(c_name),
                        Type="0",
                        Start=f"{start_sec:.3f}",
                        Num=str(c_idx),
                        Red=str(r),
                        Green=str(g),
                        Blue=str(b)
                    )

                # Organizar en árbol de playlists
                if gen not in arbol_playlists:
                    arbol_playlists[gen] = {}
                if subg not in arbol_playlists[gen]:
                    arbol_playlists[gen][subg] = []
                arbol_playlists[gen][subg].append(track_id)

            # Construir sección <PLAYLISTS>
            playlists_el = ET.SubElement(root, "PLAYLISTS")
            node_root = ET.SubElement(playlists_el, "NODE", Type="0", Name="ROOT")
            node_cleandj = ET.SubElement(node_root, "NODE", Type="0", Name="CleanDJmix")

            for gen, subdict in arbol_playlists.items():
                gen_node = ET.SubElement(node_cleandj, "NODE", Type="0", Name=gen)
                for subg, t_ids in subdict.items():
                    subg_node = ET.SubElement(gen_node, "NODE", Type="1", Name=subg, KeyType="0", Entries=str(len(t_ids)))
                    for tid in t_ids:
                        ET.SubElement(subg_node, "TRACK", Key=tid)

            raw_xml = ET.tostring(root, encoding="utf-8")
            pretty_xml = minidom.parseString(raw_xml).toprettyxml(indent="  ", encoding="utf-8")
            with open(xml_path, "wb") as f:
                f.write(pretty_xml)

            return {
                "status": "ok",
                "path": xml_path,
                "total_tracks": len(valid_tracks),
                "playlists": len(arbol_playlists)
            }
        except Exception as e:
            return {"status": "error", "msg": f"Error al generar rekordbox.xml: {e}"}

    def exportar_tracks_xls(self, tracks, destino_dir="/Users/admin/Music/mi musica"):
        try:
            if not tracks or not isinstance(tracks, list):
                return {"status": "error", "msg": "No hay pistas cargadas para exportar."}
            os.makedirs(destino_dir, exist_ok=True)
            
            try:
                import pandas as pd
                df = pd.DataFrame(tracks)
                xlsx_path = os.path.join(destino_dir, "CleanDJmix_Audit_Respaldo.xlsx")
                try:
                    df.to_excel(xlsx_path, index=False, sheet_name="Audit Master")
                    return {"status": "ok", "path": xlsx_path}
                except Exception:
                    csv_path = os.path.join(destino_dir, "CleanDJmix_Audit_Respaldo.csv")
                    df.to_csv(csv_path, index=False)
                    return {"status": "ok", "path": csv_path}
            except ImportError:
                csv_path = os.path.join(destino_dir, "CleanDJmix_Audit_Respaldo.csv")
                campos = list(tracks[0].keys()) if tracks else []
                with open(csv_path, "w", newline="", encoding="utf-8") as f:
                    writer = csv.DictWriter(f, fieldnames=campos)
                    writer.writeheader()
                    for t in tracks:
                        writer.writerow({k: t.get(k, "") for k in campos})
                return {"status": "ok", "path": csv_path}
        except Exception as e:
            return {"status": "error", "msg": str(e)}
