import eel, os, platform, subprocess
from infrastructure.superflac_service import SuperFlacService
from infrastructure.audio_scanner import AudioScannerService
from infrastructure.audio_processor import AudioProcessorService
from infrastructure.taxonomy_service import TaxonomyService

eel.init(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'web'))

@eel.expose
def seleccionar_directorio():
    if platform.system() == 'Darwin':
        try:
            cmd = '''osascript -e 'POSIX path of (choose folder with prompt "Selecciona la carpeta:")' '''
            res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            if res.returncode == 0 and res.stdout.strip():
                eel.log_to_console(f"Directorio: {res.stdout.strip()}", "success")()
                return res.stdout.strip()
        except: pass
    return None

@eel.expose
def resolver_superflac_url(url):
    eel.log_to_console(f"Resolviendo: {url}", "info")()
    return SuperFlacService.resolver_metadata(url)

@eel.expose
def iniciar_auditoria(ruta_origen):
    eel.log_to_console(f"Escaneo ultra-rápido: {ruta_origen}", "info")()
    if not os.path.exists(ruta_origen): return {"total": 0, "sin_meta": 0, "tracks": []}
    
    archivos = [os.path.join(dp, f) for dp, dn, fn in os.walk(ruta_origen) for f in fn if f.lower().endswith(('.mp3', '.wav', '.flac', '.aiff'))]
    tracks_data = []
    sin_meta = 0
    for idx, ruta in enumerate(archivos):
        t = AudioScannerService.auditar_archivo(ruta, idx + 1)
        tracks_data.append(t)
        if t["s"] == "error": sin_meta += 1
        
    eel.log_to_console(f"Escaneo completo. {len(archivos)} pistas.", "success")()
    return {"total": len(archivos), "sin_meta": sin_meta, "tracks": tracks_data}

@eel.expose
def analizar_track_profundo(ruta):
    eel.log_to_console(f"Iniciando IA Acústica para: {os.path.basename(ruta)}", "warn")()
    res = AudioProcessorService.analizar_track_avanzado(ruta)
    if res["status"] == "ok":
        eel.log_to_console("Análisis Heurístico completado.", "success")()
    return res

@eel.expose
def ejecutar_taxonomia(tracks, destino, modo="copy"):
    exitos = 0
    for t in tracks:
        if TaxonomyService.aplicar_ruteo(t['path'], destino, modo)["status"] == "ok": exitos += 1
    eel.log_to_console(f"Taxonomía {modo.upper()} completada: {exitos} archivos.", "success")()

if __name__ == '__main__':
    eel.start('index.html', size=(1400, 920), mode='chrome', cmdline_args=['--start-maximized'])
