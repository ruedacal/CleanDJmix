import os, shutil
class TaxonomyService:
    @staticmethod
    def aplicar_ruteo(ruta_origen, carpeta_destino, modo='copy'):
        try:
            if not os.path.exists(carpeta_destino): os.makedirs(carpeta_destino)
            ruta_final = os.path.join(carpeta_destino, os.path.basename(ruta_origen))
            shutil.move(ruta_origen, ruta_final) if modo == 'move' else shutil.copy2(ruta_origen, ruta_final)
            return {"status": "ok", "ruta": ruta_final, "modo": modo}
        except Exception as e: return {"status": "error", "error": str(e)}
