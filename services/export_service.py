import os
import pandas as pd

class ExportService:
    def __init__(self):
        pass

    def exportar_tracks_xls(self, tracks, destino_dir="/Users/admin/Music/mi musica"):
        try:
            if not tracks or len(tracks) == 0:
                return {"status": "error", "msg": "No hay pistas auditadas para exportar"}
            
            df = pd.DataFrame(tracks)
            os.makedirs(destino_dir, exist_ok=True)
            file_path = os.path.join(destino_dir, "CleanDJmix_Audit_Respaldo.xlsx")
            
            # Exportar a Excel con formato tabular limpio
            df.to_excel(file_path, index=False, sheet_name="Auditoria DJ")
            print(f"[EXPORT XLS] Respaldo maestro guardado en: {file_path}")
            return {"status": "ok", "path": file_path}
        except Exception as e:
            print(f"[ERROR EXPORT XLS] {e}")
            return {"status": "error", "msg": str(e)}
