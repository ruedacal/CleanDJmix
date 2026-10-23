import os
import pandas as pd

class ExportService:
    def exportar_tracks_xls(self, tracks, destino_dir="/Users/admin/Music/mi musica"):
        try:
            if not tracks or not isinstance(tracks, list):
                return {"status": "error", "msg": "No hay pistas cargadas para exportar."}
            df = pd.DataFrame(tracks)
            os.makedirs(destino_dir, exist_ok=True)
            xlsx_path = os.path.join(destino_dir, "BeatWave_Audit_Master.xlsx")
            try:
                df.to_excel(xlsx_path, index=False, sheet_name="Audit Master")
                return {"status": "ok", "path": xlsx_path}
            except Exception:
                csv_path = os.path.join(destino_dir, "BeatWave_Audit_Master.csv")
                df.to_csv(csv_path, index=False)
                return {"status": "ok", "path": csv_path}
        except Exception as e:
            return {"status": "error", "msg": str(e)}
