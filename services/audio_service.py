import os
import subprocess
import threading

class AudioPlaybackService:
    def __init__(self):
        self.directorio_actual = ""

    def establecer_directorio(self, ruta):
        self.directorio_actual = ruta

    def reproducir_mac(self, nombre_archivo_o_ruta):
        subprocess.run(["killall", "afplay"], stderr=subprocess.DEVNULL)
        if not nombre_archivo_o_ruta:
            return
            
        # Soporta tanto nombre relativo como ruta absoluta enviada desde el front
        ruta = nombre_archivo_o_ruta
        if not os.path.isabs(ruta) and self.directorio_actual:
            ruta = os.path.join(self.directorio_actual, nombre_archivo_o_ruta)
            
        if os.path.exists(ruta):
            subprocess.Popen(["afplay", ruta])
        else:
            # Fallback buscando en el directorio actual si viene limpio
            print(f"[AUDIO] No se pudo reproducir directamente: {ruta}")

    def detener_mac(self):
        subprocess.run(["killall", "afplay"], stderr=subprocess.DEVNULL)
