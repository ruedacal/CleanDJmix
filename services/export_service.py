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

        # Agrupar pistas por Género y Subgénero y aplicar metadatos Pro optimizados para Serato
        por_genero = {}
        por_subgenero = {}
        todas_rutas = []

        try:
            from infrastructure.audio_processor import AudioProcessorService
        except ImportError:
            AudioProcessorService = None

        for t in tracks:
            p = t.get("path") or t.get("f")
            if not p:
                continue

            # Inyectar metadatos optimizados en el archivo físico para Serato DJ Pro
            if AudioProcessorService and os.path.exists(p):
                try:
                    AudioProcessorService.escribir_metadatos_pro(p, t, modo_serato=True)
                except Exception as tag_err:
                    print(f"[SERATO EXPORT TAG WARN] No se pudo escribir metadatos en {p}: {tag_err}")

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
        nombre_archivo: str = "rekordbox.xml",
        incluir_memory_cues: bool = False
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

                # Hot Cues oficiales Pioneer (Type="1", Num="0".."7") y Memory Cues (Type="0", Num="-1")
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

                    # 1. Hot Cue A-H para pads físicos (Type="1", Num=0..7)
                    if c_idx < 8:
                        ET.SubElement(
                            track_el, "POSITION_MARK",
                            Name=str(c_name),
                            Type="1",
                            Start=f"{start_sec:.3f}",
                            Num=str(c_idx),
                            Red=str(r),
                            Green=str(g),
                            Blue=str(b)
                        )

                    # 2. Memory Cue oficial Pioneer (Type="0", Num="-1")
                    # Activa la cuenta atrás de compases (Bar Countdown) en la pantalla de CDJ-2000NXS2 / CDJ-3000
                    if incluir_memory_cues and c_idx in (0, 2, 3, 5, 6, 7):
                        ET.SubElement(
                            track_el, "POSITION_MARK",
                            Name=f"MEM: {c_name}",
                            Type="0",
                            Start=f"{start_sec:.3f}",
                            Num="-1"
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

    def exportar_reporte_descargas_xls(self, report_data: Dict[str, Any], destino_dir: str = "/Users/admin/Music/mi musica") -> Dict[str, Any]:
        """
        Genera un informe Excel (.xlsx) exhaustivo y formateado con diseño profesional de DJ,
        detallando pistas descargadas con certificación FFT, pistas fallidas y métricas de sesión.
        """
        import datetime
        import io
        import base64

        try:
            downloaded = report_data.get("downloaded", []) if isinstance(report_data, dict) else []
            failed = report_data.get("failed", []) if isinstance(report_data, dict) else []

            total = len(downloaded) + len(failed)
            tasa_exito = round((len(downloaded) / total * 100), 1) if total > 0 else 0.0
            timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            fecha_legible = datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S")

            filename = f"Reporte_Descargas_Spotify_{timestamp_str}.xlsx"
            os.makedirs(destino_dir, exist_ok=True)
            out_file_path = os.path.join(destino_dir, filename)

            try:
                import openpyxl
                from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
                from openpyxl.utils import get_column_letter

                wb = openpyxl.Workbook()

                # Estilos estándar BeatWave PRO
                font_title = Font(name="Arial", size=14, bold=True, color="FFFFFF")
                font_subtitle = Font(name="Arial", size=10, italic=True, color="CCCCCC")
                font_header = Font(name="Arial", size=10, bold=True, color="FFFFFF")
                font_bold = Font(name="Arial", size=10, bold=True)
                font_regular = Font(name="Arial", size=10)
                font_mono = Font(name="Courier New", size=9)

                fill_header_green = PatternFill(start_color="0F5132", end_color="0F5132", fill_type="solid")
                fill_header_red = PatternFill(start_color="842029", end_color="842029", fill_type="solid")
                fill_header_blue = PatternFill(start_color="084298", end_color="084298", fill_type="solid")
                fill_accent = PatternFill(start_color="06B6D4", end_color="06B6D4", fill_type="solid")
                fill_zebra = PatternFill(start_color="F8F9FA", end_color="F8F9FA", fill_type="solid")
                fill_green_soft = PatternFill(start_color="D1E7DD", end_color="D1E7DD", fill_type="solid")
                fill_red_soft = PatternFill(start_color="F8D7DA", end_color="F8D7DA", fill_type="solid")

                border_thin = Side(border_style="thin", color="CCCCCC")
                border_box = Border(left=border_thin, right=border_thin, top=border_thin, bottom=border_thin)

                # ==========================================
                # HOJA 1: RESUMEN DE SESIÓN
                # ==========================================
                ws_res = wb.active
                ws_res.title = "Resumen de Sesión"
                ws_res.views.sheetView[0].showGridLines = True

                ws_res.merge_cells("A1:D1")
                ws_res["A1"] = "BEATWAVE PRO • INFORME AUDITORÍA Y DESCARGAS SPOTIFY"
                ws_res["A1"].font = font_title
                ws_res["A1"].fill = fill_accent
                ws_res["A1"].alignment = Alignment(horizontal="center", vertical="center")
                ws_res.row_dimensions[1].height = 35

                ws_res.merge_cells("A2:D2")
                ws_res["A2"] = f"Generado: {fecha_legible} | Destino: {destino_dir}"
                ws_res["A2"].font = font_subtitle
                ws_res["A2"].fill = PatternFill(start_color="0B0B10", end_color="0B0B10", fill_type="solid")
                ws_res["A2"].alignment = Alignment(horizontal="center", vertical="center")
                ws_res.row_dimensions[2].height = 20

                metricas = [
                    ("Fecha y Hora de Sesión", fecha_legible),
                    ("Carpeta de Almacenamiento", destino_dir),
                    ("Total Pistas Procesadas", total),
                    ("Descargas Exitosas y Certificadas", len(downloaded)),
                    ("Pistas Fallidas / Pendientes", len(failed)),
                    ("Tasa de Efectividad", f"{tasa_exito}%")
                ]

                ws_res["A4"] = "MÉTRICA AUDITADA"
                ws_res["B4"] = "VALOR"
                ws_res["A4"].font = font_header
                ws_res["A4"].fill = fill_header_blue
                ws_res["B4"].font = font_header
                ws_res["B4"].fill = fill_header_blue

                for idx, (label, val) in enumerate(metricas, start=5):
                    ws_res[f"A{idx}"] = label
                    ws_res[f"B{idx}"] = val
                    ws_res[f"A{idx}"].font = font_bold
                    ws_res[f"B{idx}"].font = font_regular
                    ws_res[f"A{idx}"].border = border_box
                    ws_res[f"B{idx}"].border = border_box
                    if "Exitosas" in label:
                        ws_res[f"B{idx}"].fill = fill_green_soft
                        ws_res[f"B{idx}"].font = font_bold
                    elif "Fallidas" in label and len(failed) > 0:
                        ws_res[f"B{idx}"].fill = fill_red_soft
                        ws_res[f"B{idx}"].font = font_bold

                ws_res.column_dimensions["A"].width = 38
                ws_res.column_dimensions["B"].width = 50

                # ==========================================
                # HOJA 2: PISTAS DESCARGADAS (CON FFT)
                # ==========================================
                ws_ok = wb.create_sheet(title="Descargas Exitosas")
                ws_ok.views.sheetView[0].showGridLines = True

                headers_ok = [
                    "#", "Título", "Artista", "Álbum", "Formato", 
                    "Corte kHz", "Calidad FFT", "Estado", "Sample Rate (kHz)", 
                    "Bitrate (kbps)", "Pérdida", "Consejo DJ / Optimización", "Ruta Archivo en Disco"
                ]

                ws_ok.append(headers_ok)
                ws_ok.row_dimensions[1].height = 26
                for col_num in range(1, len(headers_ok) + 1):
                    cell = ws_ok.cell(row=1, column=col_num)
                    cell.font = font_header
                    cell.fill = fill_header_green
                    cell.alignment = Alignment(horizontal="center", vertical="center")

                for idx, t in enumerate(downloaded, start=1):
                    corte_val = t.get("cutoff_khz")
                    if corte_val is None or corte_val == "":
                        corte_val = t.get("corte", "--")
                    row_data = [
                        idx,
                        t.get("title") or t.get("name") or "Desconocido",
                        t.get("artist") or "Desconocido",
                        t.get("album") or "",
                        t.get("format") or "FLAC",
                        corte_val,
                        t.get("calidad") or "Pendiente",
                        t.get("status") or t.get("estado") or "Descargado",
                        t.get("sample_rate_khz") if t.get("sample_rate_khz") is not None else "--",
                        t.get("bitrate_kbps") if t.get("bitrate_kbps") is not None else "--",
                        t.get("perdida") or "--",
                        t.get("consejo") or t.get("advice") or ("Óptimo" if not t.get("es_fake") and t.get("audit_status") == "completada" else "Pendiente de análisis"),
                        t.get("path") or t.get("local_path") or ""
                    ]
                    ws_ok.append(row_data)
                    row_idx = idx + 1
                    ws_ok.row_dimensions[row_idx].height = 20
                    for c_num in range(1, len(headers_ok) + 1):
                        c = ws_ok.cell(row=row_idx, column=c_num)
                        c.font = font_regular if c_num != 13 else font_mono
                        c.border = border_box
                        if idx % 2 == 0:
                            c.fill = fill_zebra
                        if c_num in [1, 5, 6, 7, 8, 9, 10]:
                            c.alignment = Alignment(horizontal="center", vertical="center")

                for col in ws_ok.columns:
                    max_len = max(len(str(cell.value or '')) for cell in col)
                    col_letter = get_column_letter(col[0].column)
                    ws_ok.column_dimensions[col_letter].width = min(60, max(12, max_len + 3))

                # ==========================================
                # HOJA 3: PISTAS FALLIDAS
                # ==========================================
                ws_err = wb.create_sheet(title="Descargas Fallidas")
                ws_err.views.sheetView[0].showGridLines = True

                headers_err = ["#", "Título", "Artista", "Álbum", "Motivo de Fallo / Error", "ID Spotify"]
                ws_err.append(headers_err)
                ws_err.row_dimensions[1].height = 26
                for col_num in range(1, len(headers_err) + 1):
                    cell = ws_err.cell(row=1, column=col_num)
                    cell.font = font_header
                    cell.fill = fill_header_red
                    cell.alignment = Alignment(horizontal="center", vertical="center")

                for idx, t in enumerate(failed, start=1):
                    row_data = [
                        idx,
                        t.get("title") or t.get("name") or "Desconocido",
                        t.get("artist") or "Desconocido",
                        t.get("album") or "",
                        t.get("error") or "Fallo de servidor o fuente de streaming no disponible",
                        t.get("id") or t.get("spotify_id") or ""
                    ]
                    ws_err.append(row_data)
                    row_idx = idx + 1
                    ws_err.row_dimensions[row_idx].height = 20
                    for c_num in range(1, len(headers_err) + 1):
                        c = ws_err.cell(row=row_idx, column=c_num)
                        c.font = font_regular
                        c.border = border_box
                        if c_num == 5:
                            c.fill = fill_red_soft
                            c.font = font_bold
                        elif idx % 2 == 0:
                            c.fill = fill_zebra

                for col in ws_err.columns:
                    max_len = max(len(str(cell.value or '')) for cell in col)
                    col_letter = get_column_letter(col[0].column)
                    ws_err.column_dimensions[col_letter].width = min(65, max(12, max_len + 3))

                # Guardar archivo físico en disco
                wb.save(out_file_path)

                # Generar buffer en memoria para descarga directa en el navegador
                buf = io.BytesIO()
                wb.save(buf)
                b64_content = base64.b64encode(buf.getvalue()).decode("utf-8")

                return {
                    "status": "ok",
                    "path": out_file_path,
                    "filename": filename,
                    "b64": b64_content,
                    "descargadas": len(downloaded),
                    "fallidas": len(failed),
                    "total": total,
                    "tasa_exito": tasa_exito
                }
            except Exception as openpyxl_err:
                print(f"[EXPORT XLS WARN] openpyxl falló, usando fallback CSV: {openpyxl_err}")
                csv_filename = f"Reporte_Descargas_Spotify_{timestamp_str}.csv"
                csv_path = os.path.join(destino_dir, csv_filename)
                with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:
                    import csv as py_csv
                    writer = py_csv.writer(f)
                    writer.writerow(["SECCIÓN", "ESTADO", "TÍTULO", "ARTISTA", "ÁLBUM", "FORMATO", "DETALLES"])
                    for t in downloaded:
                        writer.writerow(["DESCARGADO", t.get("status", "OK"), t.get("title", ""), t.get("artist", ""), t.get("album", ""), t.get("format", "FLAC"), t.get("path", "")])
                    for t in failed:
                        writer.writerow(["FALLIDO", "ERROR", t.get("title", ""), t.get("artist", ""), t.get("album", ""), "", t.get("error", "")])
                with open(csv_path, "rb") as f:
                    csv_b64 = base64.b64encode(f.read()).decode("utf-8")
                return {
                    "status": "ok",
                    "path": csv_path,
                    "filename": csv_filename,
                    "b64": csv_b64,
                    "descargadas": len(downloaded),
                    "fallidas": len(failed),
                    "total": total,
                    "tasa_exito": tasa_exito
                }
        except Exception as e:
            return {"status": "error", "msg": str(e)}

    def exportar_set_m3u(
        self,
        tracks: List[Dict[str, Any]],
        destino_dir: str = "/Users/admin/Music/mi musica",
        nombre_set: str = "BeatWave_DJ_Set"
    ) -> Dict[str, Any]:
        """Exporta una lista secuencial de pistas a un archivo estándar M3U8 para Rekordbox, Serato, Traktor o VirtualDJ."""
        if not tracks or not isinstance(tracks, list):
            return {"status": "error", "msg": "No hay pistas en el set para exportar."}

        try:
            import datetime
            import re
            os.makedirs(destino_dir, exist_ok=True)
            sanitized_name = re.sub(r'[^\w\s-]', '', nombre_set).strip().replace(' ', '_') or "BeatWave_DJ_Set"
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{sanitized_name}_{timestamp}.m3u8"
            filepath = os.path.join(destino_dir, filename)

            lines = [
                "#EXTM3U",
                f"#PLAYLIST:{nombre_set}",
                f"#EXTENC:UTF-8",
                f"#GENERATOR:BeatWave Pro Set-Builder Canvas",
                f"#DATE:{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                ""
            ]

            for trk in tracks:
                dur_sec = -1
                dur_raw = trk.get("duration") or trk.get("duration_sec") or trk.get("d")
                if dur_raw:
                    try:
                        dur_sec = int(float(dur_raw))
                    except (ValueError, TypeError):
                        dur_sec = -1

                artist = trk.get("artist") or trk.get("a") or "Desconocido"
                title = trk.get("title") or trk.get("t") or trk.get("filename") or "Pista"
                path = trk.get("path") or trk.get("filepath") or trk.get("f") or trk.get("filename") or ""

                lines.append(f"#EXTINF:{dur_sec},{artist} - {title}")
                lines.append(str(path))

            m3u_content = "\n".join(lines) + "\n"

            with open(filepath, "w", encoding="utf-8") as f:
                f.write(m3u_content)

            return {
                "status": "ok",
                "path": filepath,
                "filename": filename,
                "total_tracks": len(tracks),
                "content": m3u_content
            }
        except Exception as e:
            return {"status": "error", "msg": f"Error exportando M3U8: {str(e)}"}

    def exportar_traktor_nml(
        self,
        tracks: List[Dict[str, Any]],
        destino_dir: str = "/Users/admin/Music/mi musica"
    ) -> Dict[str, Any]:
        """Genera un archivo NML nativo de Traktor Pro (traktor_collection.nml) con Hot Cues y Beatgrids."""
        if not tracks or not isinstance(tracks, list):
            return {"status": "error", "msg": "No hay pistas para exportar Traktor NML."}

        try:
            os.makedirs(destino_dir, exist_ok=True)
            filepath = os.path.join(destino_dir, "traktor_collection.nml")

            root = ET.Element("NML", VERSION="19")
            ET.SubElement(root, "HEAD", COMPANY="Native Instruments GmbH", PROGRAM="Traktor Pro via BeatWave")
            collection = ET.SubElement(root, "COLLECTION", ENTRIES=str(len(tracks)))

            for trk in tracks:
                path = trk.get("path") or trk.get("filepath") or trk.get("f") or trk.get("filename") or ""
                artist = trk.get("artist") or trk.get("a") or "Desconocido"
                title = trk.get("title") or trk.get("t") or os.path.basename(path)

                entry = ET.SubElement(collection, "ENTRY", ARTIST=artist, TITLE=title)
                
                # Descomponer ruta para Traktor: DIR, FILE, VOLUME
                dir_name = os.path.dirname(path)
                file_name = os.path.basename(path)
                parts = [p for p in dir_name.strip("/").split("/") if p]
                traktor_dir = "/:" + "/:".join(parts) + "/:" if parts else "/:"
                
                ET.SubElement(entry, "LOCATION", DIR=traktor_dir, FILE=file_name, VOLUME="/", VOLUMEID="")
                
                # INFO & Metadatos
                dur_raw = trk.get("duration") or trk.get("duration_sec") or trk.get("d") or 300
                dur_sec = 300
                try:
                    if isinstance(dur_raw, str) and ":" in dur_raw:
                        p = dur_raw.split(":")
                        dur_sec = int(p[0]) * 60 + int(p[1])
                    else:
                        dur_sec = int(float(dur_raw))
                except Exception:
                    dur_sec = 300

                info = ET.SubElement(entry, "INFO", PLAYTIME=str(dur_sec), BITRATE=str(trk.get("bitrate_kbps") or 320))
                if trk.get("comment"):
                    info.set("COMMENT", str(trk.get("comment")))
                if trk.get("genre"):
                    info.set("GENRE", str(trk.get("genre")))

                # TEMPO
                bpm = float(trk.get("bpm") or trk.get("b") or 128.0)
                ET.SubElement(entry, "TEMPO", BPM=f"{bpm:.6f}", BPM_QUALITY="100.000000")

                # Cues 1-8 en Traktor (CUE_V2 con START en milisegundos)
                cues = trk.get("cues") or []
                for c_idx, cue in enumerate(cues[:8]):
                    if not isinstance(cue, dict):
                        continue
                    pct = float(cue.get("pct") or 0.0)
                    start_ms = float(pct * dur_sec * 1000.0)
                    c_name = cue.get("name") or f"Cue {c_idx + 1}"
                    # HOTCUE="0..7", TYPE="0" (Cue normal) o TYPE="5" (Grid)
                    cue_type = "5" if c_idx == 0 else "0"
                    ET.SubElement(
                        entry, "CUE_V2",
                        NAME=c_name,
                        DISPL_ORDER="0",
                        TYPE=cue_type,
                        START=f"{start_ms:.3f}",
                        LEN="0.000000",
                        REPEATS="-1",
                        HOTCUE=str(c_idx)
                    )

            # Formatear XML
            raw_xml = ET.tostring(root, encoding="utf-8")
            parsed = minidom.parseString(raw_xml)
            pretty_xml = parsed.toprettyxml(indent="  ", encoding="utf-8")

            with open(filepath, "wb") as f:
                f.write(pretty_xml)

            return {
                "status": "ok",
                "path": filepath,
                "filename": "traktor_collection.nml",
                "total_tracks": len(tracks)
            }
        except Exception as e:
            return {"status": "error", "msg": f"Error exportando Traktor NML: {str(e)}"}

    def sincronizar_pasaporte_universal(
        self,
        tracks: List[Dict[str, Any]],
        destino_dir: str = "/Users/admin/Music/mi musica"
    ) -> Dict[str, Any]:
        """Ejecuta la sincronización universal DJ en 1 clic para Serato, Rekordbox, Traktor y VirtualDJ."""
        if not tracks or not isinstance(tracks, list):
            return {"status": "error", "msg": "No hay pistas para el Pasaporte Universal."}

        results = {
            "status": "ok",
            "serato": None,
            "rekordbox": None,
            "traktor": None,
            "virtualdj_m3u": None,
            "total_tracks": len(tracks),
            "errors": []
        }

        # 1. Serato Crates
        try:
            ser_res = self.exportar_serato_crates(tracks)
            results["serato"] = ser_res
        except Exception as e:
            results["errors"].append(f"Serato: {str(e)}")

        # 2. Rekordbox XML
        try:
            rek_res = self.exportar_rekordbox_xml(tracks, destino_dir=destino_dir)
            results["rekordbox"] = rek_res
        except Exception as e:
            results["errors"].append(f"Rekordbox: {str(e)}")

        # 3. Traktor Pro NML
        try:
            trk_res = self.exportar_traktor_nml(tracks, destino_dir=destino_dir)
            results["traktor"] = trk_res
        except Exception as e:
            results["errors"].append(f"Traktor: {str(e)}")

        # 4. VirtualDJ / Universal M3U8
        try:
            m3u_res = self.exportar_set_m3u(tracks, destino_dir=destino_dir, nombre_set="Universal_DJ_Passport")
            results["virtualdj_m3u"] = m3u_res
        except Exception as e:
            results["errors"].append(f"M3U8: {str(e)}")

        return results
