import os
import pandas as pd

class ExportService:
    def __init__(self):
        pass

    def exportar_tracks_xls(self, tracks, destino_dir="/Users/admin/Music/mi musica"):
        try:
            if not tracks or not isinstance(tracks, list) or len(tracks) == 0:
                return {"status": "error", "msg": "No hay pistas auditadas disponibles para exportar."}
            
            df = pd.DataFrame(tracks)
            os.makedirs(destino_dir, exist_ok=True)
            
            # Intentar exportar a Excel; si openpyxl no está disponible, fallback a CSV
            file_xlsx = os.path.join(destino_dir, "CleanDJmix_Audit_Respaldo.xlsx")
            try:
                df.to_excel(file_xlsx, index=False, sheet_name="Auditoria DJ")
                print(f"[EXPORT] Respaldo Excel guardado en: {file_xlsx}")
                return {"status": "ok", "path": file_xlsx}
            except Exception:
                file_csv = os.path.join(destino_dir, "CleanDJmix_Audit_Respaldo.csv")
                df.to_csv(file_csv, index=False)
                print(f"[EXPORT] Respaldo CSV guardado en: {file_csv}")
                return {"status": "ok", "path": file_csv}
                
        except Exception as e:
            print(f"[ERROR EXPORT] {e}")
            return {"status": "error", "msg": str(e)}
