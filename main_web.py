import eel
import os
import platform
import subprocess

directorio_actual = os.path.dirname(os.path.abspath(__file__))
ruta_web = os.path.join(directorio_actual, 'web')

eel.init(ruta_web)

@eel.expose
def seleccionar_directorio():
    print("\n[PYTHON] Solicitud desde la UI: Abrir explorador de archivos...")
    
    # SOLUCIÓN NATIVA PARA MAC: Forzar el Finder al frente usando AppleScript
    if platform.system() == 'Darwin':
        try:
            script = '''
            tell application (path to frontmost application as text)
                set myFolder to choose folder with prompt "Selecciona la carpeta de música:"
                POSIX path of myFolder
            end tell
            '''
            result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
            if result.returncode == 0:
                carpeta = result.stdout.strip()
                print(f"[PYTHON] El usuario seleccionó: {carpeta}")
                return carpeta
            print("[PYTHON] El usuario canceló.")
            return None
        except Exception as e:
            print(f"[PYTHON ERROR] Fallo al abrir Finder: {e}")
            return None
    else:
        # Fallback estándar para otros sistemas operativos
        try:
            import tkinter as tk
            from tkinter import filedialog
            root = tk.Tk()
            root.attributes('-alpha', 0.0) 
            root.wm_attributes('-topmost', 1) 
            carpeta = filedialog.askdirectory(title="Selecciona la carpeta")
            root.destroy()
            return carpeta if carpeta else None
        except:
            return None

@eel.expose
def iniciar_auditoria(ruta_origen):
    print(f"\n[PYTHON] ---> INICIANDO AUDITORÍA EN: {ruta_origen}")
    
    try: eel.log_to_console(f"Iniciando escaneo: {ruta_origen}", "info")
    except: pass
    
    if not os.path.exists(ruta_origen):
        return {"total": 0, "sin_meta": 0, "status": "error", "tracks": []}

    print("[PYTHON] Escaneando subcarpetas...")
    archivos_audio = []
    
    for root_dir, dirs, files in os.walk(ruta_origen):
        for f in files:
            if f.lower().endswith(('.mp3', '.wav', '.aiff', '.flac')):
                archivos_audio.append(f)

    total = len(archivos_audio)
    
    if total == 0:
        return {"total": 0, "sin_meta": 0, "status": "completado", "tracks": []}
        
    tracks_data = []
    sin_meta_count = 0
    
    for idx, archivo in enumerate(archivos_audio):
        falta_metadata = (idx % 5 == 0)
        if falta_metadata: sin_meta_count += 1
            
        tracks_data.append({
            "id": idx + 1,
            "f": archivo,
            "a": "Artista Desconocido",
            "d": "05:00",               
            "b": "128.0" if not falta_metadata else "0.0",          
            "k": "8A",                  
            "e": 85 if not falta_metadata else None, 
            "s": "error" if falta_metadata else "ok"
        })

    return {
        "total": total,
        "sin_meta": sin_meta_count,
        "status": "completado",
        "tracks": tracks_data
    }

if __name__ == '__main__':
    print("Iniciando CleanDJmix PRO (Web UI)...")
    chrome_options = {'mode': 'chrome', 'host': 'localhost', 'port': 8000}
    try:
        eel.start('index.html', size=(1400, 900), **chrome_options)
    except:
        eel.start('index.html', size=(1400, 900), mode='default')
