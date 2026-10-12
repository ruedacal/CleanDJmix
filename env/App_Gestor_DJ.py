import os
import shutil
import threading
import time
import tkinter as tk
from tkinter import filedialog, scrolledtext
from tkinter import ttk
import requests
import librosa
import numpy as np
from mutagen.easyid3 import EasyID3

# --- CONFIGURACIÓN MAESTRA ---
DISCOGS_TOKEN = "oCKSbtPTEZswVFlXCvKLkHxAVAIpauwnnJZUERVD"
CARPETAS_DESTINO = ["Techno", "Tech House", "Remember", "Cantaditas", "Trance", "House", "Revision_Manual"]

def buscar_discogs(artista, titulo):
    if not artista or not titulo:
        return 2026, []
    query = f"{artista} {titulo}".replace(" ", "+")
    url = f"https://api.discogs.com/database/search?q={query}&type=release&token={DISCOGS_TOKEN}"
    try:
        respuesta = requests.get(url, headers={"User-Agent": "GestorDJ/1.0"}, timeout=5)
        if respuesta.status_code == 200 and respuesta.json().get('results'):
            res = respuesta.json()['results'][0]
            año = int(res.get('year', 2026)) if str(res.get('year', '')).isdigit() else 2026
            estilos = [e.lower() for e in res.get('style', [])]
            return año, estilos
    except:
        pass
    return 2026, []

def cerebro_ishkur(bpm, año, estilos, presencia_vocal, zcr, centroide):
    estilos_str = " ".join(estilos)
    
    # 1. REMEMBER (Cronología)
    if 1980 < año < 2011:
        return "Remember"
        
    # 2. CANTADITAS
    if "eurodance" in estilos_str or "makina" in estilos_str or "happy hardcore" in estilos_str:
        return "Cantaditas"
    if presencia_vocal > 3000 and 130 <= bpm <= 145 and "vocal" in estilos_str:
        return "Cantaditas"
        
    # 3. TRANCE
    if "trance" in estilos_str or "psy-trance" in estilos_str or (bpm >= 135 and centroide > 2500 and presencia_vocal < 2000):
        return "Trance"
        
    # 4. TECHNO / HARD TECHNO
    if "schranz" in estilos_str or "hard techno" in estilos_str or "industrial" in estilos_str:
        return "Techno" 
        
    # 5. TECH HOUSE
    if "tech house" in estilos_str:
        return "Tech House"
        
    # 6. HOUSE
    if "house" in estilos_str and "tech" not in estilos_str:
        return "House"
        
    # 7. TECHNO (Estándar)
    if "techno" in estilos_str:
        return "Techno"
        
    # DESEMPATE MATEMÁTICO DE ALTA RESOLUCIÓN
    if bpm > 138 and zcr > 0.08:
        return "Techno" # Hard Techno
    elif bpm > 128:
        return "Techno"
    else:
        return "Tech House"

class AplicacionDJ:
    def __init__(self, root):
        self.root = root
        self.root.title("Clasificador Musical DJ - Motor Ishkur Alta Resolución")
        self.root.geometry("800x550")
        self.root.configure(bg="#1e1e1e")
        
        style = ttk.Style()
        style.theme_use('clam')
        style.configure("TButton", padding=6, relief="flat", background="#333", foreground="white")
        style.configure("TLabel", background="#1e1e1e", foreground="white", font=("Arial", 11))
        
        ttk.Label(root, text="Ruta de tu colección:", font=("Arial", 12, "bold")).pack(pady=(20, 5))
        
        frame_ruta = tk.Frame(root, bg="#1e1e1e")
        frame_ruta.pack(fill="x", padx=20)
        self.entry_ruta = tk.Entry(frame_ruta, width=60, font=("Arial", 11))
        self.entry_ruta.insert(0, "/Users/admin/Music/mi musica/")
        self.entry_ruta.pack(side="left", padx=(0, 10), fill="x", expand=True)
        ttk.Button(frame_ruta, text="Examinar...", command=self.seleccionar_ruta).pack(side="right")
        
        self.btn_iniciar = tk.Button(root, text="🔥 INICIAR ANÁLISIS DE ALTA PRECISIÓN 🔥", bg="#ff3366", fg="white", font=("Arial", 13, "bold"), command=self.iniciar_hilo)
        self.btn_iniciar.pack(pady=20, ipadx=20, ipady=10)
        
        self.progreso = ttk.Progressbar(root, orient="horizontal", mode="determinate")
        self.progreso.pack(fill="x", padx=20, pady=(0, 10))
        
        self.consola = scrolledtext.ScrolledText(root, height=15, bg="#000000", fg="#00ff00", font=("Menlo", 10))
        self.consola.pack(padx=20, pady=(0, 20), fill="both", expand=True)
        self.consola.insert(tk.END, "[SISTEMA] Motor de Alta Resolución + Discogs listo.\n")
        
    def log(self, mensaje):
        self.consola.insert(tk.END, mensaje + "\n")
        self.consola.see(tk.END)
        
    def seleccionar_ruta(self):
        ruta = filedialog.askdirectory()
        if ruta:
            self.entry_ruta.delete(0, tk.END)
            self.entry_ruta.insert(0, ruta)
            
    def iniciar_hilo(self):
        self.btn_iniciar.config(state="disabled")
        threading.Thread(target=self.procesar_biblioteca, daemon=True).start()
        
    def procesar_biblioteca(self):
        ruta_base = self.entry_ruta.get()
        archivos_mp3 = []
        
        for root_dir, dirs, files in os.walk(ruta_base):
            for file in files:
                if file.lower().endswith('.mp3'):
                    archivos_mp3.append(os.path.join(root_dir, file))
                    
        total = len(archivos_mp3)
        if total == 0:
            self.log("❌ No se encontraron archivos MP3 en la ruta.")
            self.btn_iniciar.config(state="normal")
            return
            
        self.progreso["maximum"] = total
        self.log(f"🚀 Iniciando procesamiento de {total} pistas a 44.100Hz...\n")
        
        for carpeta in CARPETAS_DESTINO:
            ruta_dir = os.path.join(ruta_base, carpeta)
            if not os.path.exists(ruta_dir):
                os.makedirs(ruta_dir)
                
        procesadas = 0
        for ruta_completa in archivos_mp3:
            procesadas += 1
            nombre_archivo = os.path.basename(ruta_completa)
            
            if any(ruta_completa == os.path.join(ruta_base, c, nombre_archivo) for c in CARPETAS_DESTINO):
                self.progreso["value"] = procesadas
                continue
                
            self.log(f"[{procesadas}/{total}] Analizando: {nombre_archivo}")
            time.sleep(1.2) 
            
            try:
                tags = EasyID3(ruta_completa)
                artista = tags.get('artist', [''])[0].split(' feat')[0].strip()
                titulo = tags.get('title', [''])[0].split('(')[0].strip()
                
                año, estilos = buscar_discogs(artista, titulo)
                
                # ANÁLISIS DE ALTA RESOLUCIÓN (44.100Hz, 60 segundos)
                y, sr = librosa.load(ruta_completa, sr=44100, duration=60.0)
                tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
                bpm = round(tempo[0], 2) if isinstance(tempo, (list, np.ndarray)) else round(tempo, 2)
                
                zcr = np.mean(librosa.feature.zero_crossing_rate(y))
                centroide = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
                mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
                presencia_vocal = np.mean(np.var(mfcc[1:13], axis=1))
                
                categoria = cerebro_ishkur(bpm, año, estilos, presencia_vocal, zcr, centroide)
                ruta_destino = os.path.join(ruta_base, categoria, nombre_archivo)
                
                shutil.move(ruta_completa, ruta_destino)
                self.log(f"   ↳ ✅ Movido a: {categoria} (Año: {año}, BPM: {bpm})\n")
                
            except Exception as e:
                self.log(f"   ↳ ⚠️ Error de lectura: Enviado a Revision_Manual\n")
                try:
                    shutil.move(ruta_completa, os.path.join(ruta_base, "Revision_Manual", nombre_archivo))
                except:
                    pass
                    
            self.progreso["value"] = procesadas
            
        self.log("🎉 ¡PROCESO COMPLETADO! Tu librería ha sido organizada físicamente.")
        self.btn_iniciar.config(state="normal")

if __name__ == "__main__":
    root = tk.Tk()
    app = AplicacionDJ(root)
    root.mainloop()