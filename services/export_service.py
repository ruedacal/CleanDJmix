import os
import csv

class ExportService:
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
