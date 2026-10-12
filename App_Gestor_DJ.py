import os
import shutil
import threading
import time
import re
import asyncio
import logging
import traceback
import tkinter as tk
from tkinter import filedialog, scrolledtext, ttk
import requests
import librosa
import numpy as np
import soundfile as sf
from mutagen.easyid3 import EasyID3
import mutagen.id3
from shazamio import Shazam

# --- CONFIGURACIÓN MAESTRA ---
DISCOGS_TOKEN = "oCKSbtPTEZswVFlXCvKLkHxAVAIpauwnnJZUERVD"
CARPETAS_DESTINO = ["Techno", "Tech House", "Remember", "Cantaditas", "Trance", "House", "Revision_Manual"]
DEV_CONTACT = "rueda.v@gmail.com"

# --- SISTEMA DE LOGGING LOCAL ---
logging.basicConfig(
    filename='CleanDJmix_crash.log',
    level=logging.ERROR,
    format='%(asctime)s - [CleanDJmix Error] - %(message)s'
)

def limpiar_texto(texto):
    if not texto: return ""
    texto = re.sub(r'(?i)_?spotdown\.org', '', texto)
    texto = re.sub(r'(?i)\.mp3', '', texto)
    texto = re.sub(r'(?i)(www\.|http)[^\s]+', '', texto)
    texto = re.sub(r'^\d+[_ -]+', '', texto)
    texto = re.sub(r'\[.*?\]', '', texto)
    texto = re.sub(r'\(.*?\)', '', texto)
    texto = texto.replace('_', ' ')
    texto = re.sub(r'\s+', ' ', texto).strip()
    return texto

def obtener_metadatos_limpios(ruta_completa, nombre_archivo):
    artista, titulo = "", ""
    try:
        tags = EasyID3(ruta_completa)
        artista = tags.get('artist', [''])[0]
        titulo = tags.get('title', [''])[0]
    except:
        pass

    artista = limpiar_texto(artista)
    titulo = limpiar_texto(titulo)
    nombre_limpio = limpiar_texto(nombre_archivo)

    if not artista or not titulo:
        if '-' in nombre_limpio:
            partes = nombre_limpio.split('-', 1)
            if not artista: artista = partes[0].strip()
            if not titulo: titulo = partes[1].strip()
        else:
            if not titulo: titulo = nombre_limpio.strip()
            
    if not artista or titulo.lower().startswith("track") or titulo == "":
        carpeta_padre = os.path.basename(os.path.dirname(ruta_completa))
        if carpeta_padre and carpeta_padre not in CARPETAS_DESTINO and carpeta_padre.lower() not in ["mi musica", "descargas", "downloads", "music"]:
            carpeta_limpia = limpiar_texto(carpeta_padre)
            if '-' in carpeta_limpia:
                partes = carpeta_limpia.split('-', 1)
                if not artista: artista = partes[0].strip()
                if not titulo or titulo == nombre_limpio: titulo = f"{partes[1].strip()}"
            else:
                if not artista: artista = carpeta_limpia
                
    if not artista: artista = "VRC_MISSING"
    if not titulo: titulo = "VRC_MISSING"
            
    return artista, titulo

def rescate_shazam(ruta_archivo):
    async def _reconocer():
        shazam = Shazam()
        return await shazam.recognize_song(ruta_archivo)
    
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        resultado = loop.run_until_complete(_reconocer())
        loop.close()
        
        if 'track' in resultado and resultado['track']:
            artista = resultado['track'].get('subtitle', '')
            titulo = resultado['track'].get('title', '')
            return limpiar_texto(artista), limpiar_texto(titulo)
    except Exception:
        pass
    return "VRC_MISSING", "VRC_MISSING"

def buscar_discogs_oficial(artista, titulo):
    if artista == "VRC_MISSING" and titulo == "VRC_MISSING":
        return 2026, [], "VRC_Unidentified", "Track"

    query = f"{artista} {titulo}".replace(" ", "+").replace("VRC_MISSING", "")
    url = f"https://api.discogs.com/database/search?q={query}&type=release&token={DISCOGS_TOKEN}"
    
    try:
        respuesta = requests.get(url, headers={"User-Agent": "CleanDJmix/2.1"}, timeout=5)
        if respuesta.status_code == 200 and respuesta.json().get('results'):
            res = respuesta.json()['results'][0]
            año = int(res.get('year', 2026)) if str(res.get('year', '')).isdigit() else 2026
            estilos = [e.lower() for e in res.get('style', [])]
            
            titulo_oficial_completo = res.get('title', '')
            
            if " - " in titulo_oficial_completo:
                partes = titulo_oficial_completo.split(" - ", 1)
                art_descubierto = partes[0].strip()
                art_descubierto = re.sub(r'\s\(\d+\)$', '', art_descubierto)
                tit_descubierto = partes[1].strip()
                
                if "various" not in art_descubierto.lower():
                    artista = art_descubierto
                titulo = tit_descubierto
                
            return año, estilos, artista, titulo
    except:
        pass
    
    return 2026, [], artista, titulo

def analizar_acustica_profunda(ruta_completa):
    """Módulo aislado: Recorte de silencios + Energía + Groove + BPM"""
    y, sr = librosa.load(ruta_completa, sr=44100, duration=60.0)
    
    # Corte de silencio físico
    y_trimmed, indices = librosa.effects.trim(y, top_db=40)
    silencio_inicio_ms = round((indices[0] / sr) * 1000)
    if silencio_inicio_ms > 40:
        y_full, sr_full = librosa.load(ruta_completa, sr=None)
        y_full_trimmed, _ = librosa.effects.trim(y_full, top_db=40)
        sf.write(ruta_completa, y_full_trimmed, sr_full)
        y = y_trimmed

    # Extracción de métricas de DJ
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    bpm = round(tempo[0], 2) if isinstance(tempo, (list, np.ndarray)) else round(tempo, 2)
    
    energia = int((np.mean(librosa.feature.rms(y=y)) / 0.35) * 100)
    energia = min(100, max(0, energia))
    
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    groove = int(((np.var(onset_env) / np.mean(onset_env)) / 5.0) * 100) if np.mean(onset_env) > 0 else 0
    groove = min(100, max(0, groove))
    
    return bpm, energia, groove

def corregir_etiquetas_y_nombre(ruta_completa, artista_oficial, titulo_oficial, año, bpm, modo_seguro=False):
    if not modo_seguro:
        try:
            try:
                tags = EasyID3(ruta_completa)
            except mutagen.id3.ID3NoHeaderError:
                tags = mutagen.File(ruta_completa, easy=True)
                if tags is None:
                    tags = mutagen.File(ruta_completa)
                    tags.add_tags()
                    tags = EasyID3(ruta_completa)
                    
            tags['artist'] = artista_oficial
            tags['title'] = titulo_oficial
            tags['date'] = str(año)
            tags['bpm'] = str(int(bpm))
            tags.save(ruta_completa)
        except Exception as e:
            pass

    if "VRC_Unidentified" in artista_oficial or "VRC_MISSING" in artista_oficial:
        nuevo_nombre = f"VRC_Unidentified_Track_{int(bpm)}BPM.mp3"
    else:
        nuevo_nombre = f"{artista_oficial} - {titulo_oficial}.mp3"
        if nuevo_nombre.startswith("VRC_MISSING - "):
            nuevo_nombre = f"{titulo_oficial}.mp3"
            
    nuevo_nombre = re.sub(r'[\\/*?:"<>|]', "", nuevo_nombre)
    return nuevo_nombre

def cerebro_ishkur(bpm, año, estilos, presencia_vocal, zcr, centroide):
    estilos_str = " ".join(estilos)
    
    if 1980 < año < 2011: return "Remember"
    if "eurodance" in estilos_str or "makina" in estilos_str or "happy hardcore" in estilos_str: return "Cantaditas"
    if presencia_vocal > 3000 and 130 <= bpm <= 145 and "vocal" in estilos_str: return "Cantaditas"
    if "trance" in estilos_str or "psy-trance" in estilos_str or (bpm >= 135 and centroide > 2500 and presencia_vocal < 2000): return "Trance"
    
    if "schranz" in estilos_str or "hard techno" in estilos_str or "industrial" in estilos_str: return "Techno"
    if "melodic" in estilos_str or "progressive house" in estilos_str: return "Techno"
    if "tech house" in estilos_str: return "Tech House"
    if "house" in estilos_str and "tech" not in estilos_str: return "House"
    if "techno" in estilos_str: return "Techno"
    
    if bpm > 138 and zcr > 0.08: return "Techno"
    elif bpm > 128: return "Techno"
    else: return "Tech House"


class AplicacionDJ:
    def __init__(self, root):
        self.root = root
        self.root.title("CleanDJmix PRO by Victor Rueda")
        self.root.geometry("1024x840")
        self.root.resizable(False, False)
        self.root.configure(bg="#181818")
        
        self.safe_mode_var = tk.BooleanVar(value=True)
        self.cancel_flag = False
        
        main_container = tk.Frame(root, bg="#181818")
        main_container.pack(fill=tk.BOTH, expand=True, padx=30, pady=25)
        
        # --- HEADER ---
        header_frame = tk.Frame(main_container, bg="#181818")
        header_frame.pack(fill=tk.X, pady=(0, 15))
        tk.Label(header_frame, text="CleanDJmix PRO", font=("Helvetica Neue", 32, "bold"), bg="#181818", fg="#FFFFFF").pack(side=tk.LEFT)
        
        badge_frame = tk.Frame(header_frame, bg="#181818")
        badge_frame.pack(side=tk.RIGHT)
        tk.Label(badge_frame, text="POR VICTOR RUEDA", font=("Helvetica Neue", 10, "bold"), bg="#242424", fg="#00AEEF").pack(side=tk.TOP, fill=tk.X, pady=(0,2), ipady=2)
        tk.Label(badge_frame, text="v2.1 ESPAÑOL", font=("Helvetica Neue", 9, "bold"), bg="#181818", fg="#666666").pack(side=tk.BOTTOM)
        
        # --- RUTA COLECCIÓN ---
        ruta_frame = tk.Frame(main_container, bg="#242424", bd=0, relief="flat")
        ruta_frame.pack(fill=tk.X, pady=10)
        
        tk.Label(ruta_frame, text="CARPETA DE MÚSICA", font=("Helvetica Neue", 11, "bold"), bg="#242424", fg="#888888").pack(side=tk.LEFT, padx=15, pady=15)
        
        self.entry_ruta = tk.Entry(ruta_frame, bg="#1e1e1e", fg="#FFFFFF", font=("Courier", 13), insertbackground="white", relief="flat", highlightthickness=1, highlightbackground="#333333")
        self.entry_ruta.insert(0, "/Users/admin/Music/mi musica/")
        self.entry_ruta.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=10, ipady=6)
        
        self.btn_ruta = tk.Label(ruta_frame, text=" EXPLORAR ", bg="#333333", fg="#FFFFFF", font=("Helvetica Neue", 11, "bold"), cursor="hand2")
        self.btn_ruta.pack(side=tk.RIGHT, padx=15, ipadx=12, ipady=6)
        self.btn_ruta.bind("<Button-1>", lambda e: self.seleccionar_ruta())
        
        # --- PANTALLA LCD CENTRAL ---
        self.lcd_frame = tk.Frame(main_container, bg="#111111", bd=0, relief="flat")
        self.lcd_frame.pack(fill=tk.X, pady=15)
        
        self.lbl_file = tk.Label(self.lcd_frame, text="ARCHIVO: ESPERANDO PISTA...", font=("Menlo", 12), bg="#111111", fg="#666666")
        self.lbl_file.pack(pady=(20, 0), fill=tk.X)
        
        self.lbl_id3 = tk.Label(self.lcd_frame, text="ETIQUETA ID3: EN ESPERA", font=("Menlo", 15, "bold"), bg="#111111", fg="#FFFFFF")
        self.lbl_id3.pack(pady=(5, 5), fill=tk.X)
        
        self.lbl_wave = tk.Label(self.lcd_frame, text="ılıılıılıılıılıılıılıılıılıılıılıılıılıılıılıılıılıılıılıılıılı", font=("Arial", 18), bg="#111111", fg="#333333")
        self.lbl_wave.pack(pady=2)
        
        self.lbl_stats = tk.Label(self.lcd_frame, text="BPM: 000.00  |  AÑO: 0000  |  GÉNERO: PENDIENTE", font=("Courier", 16, "bold"), bg="#111111", fg="#00AEEF")
        self.lbl_stats.pack(pady=(5, 20), fill=tk.X)
        
        # --- TOGGLE MODO SEGURO ---
        safe_mode_cb = tk.Checkbutton(main_container, text="MODO SEGURO (Simulación: No modifica archivos físicos)",
                                      variable=self.safe_mode_var, bg="#181818", fg="#AAAAAA", selectcolor="#242424",
                                      activebackground="#181818", activeforeground="#FFFFFF", font=("Helvetica Neue", 11))
        safe_mode_cb.pack(pady=(0, 10))
        
        # --- BARRA DE PROGRESO ---
        style = ttk.Style()
        style.theme_use('default')
        style.configure("TProgressbar", thickness=6, background="#00AEEF", troughcolor="#242424", borderwidth=0)
        self.progreso = ttk.Progressbar(main_container, orient="horizontal", mode="determinate", style="TProgressbar")
        self.progreso.pack(fill=tk.X, pady=(0, 15))
        
        # --- BOTONES DE CONTROL (3 MÓDULOS) ---
        botones_frame = tk.Frame(main_container, bg="#181818")
        botones_frame.pack(fill=tk.X, pady=5)
        
        self.btn_iniciar = tk.Label(botones_frame, text="[ ANÁLISIS ESTÁNDAR ]", bg="#00AEEF", fg="#000000", font=("Helvetica Neue", 11, "bold"), cursor="hand2")
        self.btn_iniciar.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=12, padx=(0, 3))
        self.btn_iniciar.bind("<Button-1>", lambda e: self.iniciar_hilo(modo="normal"))
        
        self.btn_rescue = tk.Label(botones_frame, text="[ RESCATE SHAZAM ]", bg="#242424", fg="#00AEEF", font=("Helvetica Neue", 11, "bold"), cursor="hand2")
        self.btn_rescue.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=12, padx=(3, 3))
        self.btn_rescue.bind("<Button-1>", lambda e: self.iniciar_hilo(modo="rescate"))

        self.btn_acustico = tk.Label(botones_frame, text="[ ANÁLISIS ACÚSTICO ]", bg="#242424", fg="#FFAA00", font=("Helvetica Neue", 11, "bold"), cursor="hand2")
        self.btn_acustico.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=12, padx=(3, 3))
        self.btn_acustico.bind("<Button-1>", lambda e: self.iniciar_hilo(modo="acustico"))
        
        self.btn_cancelar = tk.Label(botones_frame, text="[ CANCELAR ]", bg="#FF3333", fg="#FFFFFF", font=("Helvetica Neue", 11, "bold"), cursor="hand2", state="disabled")
        self.btn_cancelar.pack(side=tk.RIGHT, fill=tk.X, expand=True, ipady=12, padx=(3, 0))
        
        # --- CONSOLA LOG ---
        self.consola = scrolledtext.ScrolledText(main_container, bg="#111111", fg="#AAAAAA", font=("Menlo", 11), bd=0, relief="flat", highlightthickness=0)
        self.consola.pack(fill=tk.BOTH, expand=True, pady=(15, 0))
        
        self.consola.tag_config("info", foreground="#00AEEF")
        self.consola.tag_config("error", foreground="#FF3333")
        self.consola.tag_config("success", foreground="#FFFFFF")
        self.consola.tag_config("tag", foreground="#AAAAAA")
        self.consola.tag_config("simulacro", foreground="#FF00FF")
        self.consola.tag_config("warning", foreground="#FFAA00")
        self.consola.tag_config("shazam", foreground="#00AEEF")
        
        self.log("CleanDJmix PRO cargado correctamente. Selecciona una opción para comenzar.\n", "info")
        self._keep_alive()

    def _keep_alive(self):
        self.root.update_idletasks()
        self.root.after(50, self._keep_alive)

    def log(self, mensaje, tag="info"):
        self.consola.insert(tk.END, mensaje + "\n", tag)
        self.consola.see(tk.END)
        
    def seleccionar_ruta(self):
        ruta = filedialog.askdirectory()
        if ruta:
            self.entry_ruta.delete(0, tk.END)
            self.entry_ruta.insert(0, ruta)
            
    def cancelar_hilo(self):
        self.cancel_flag = True
        self.log("\n[!] INTERRUPCIÓN SOLICITADA. Deteniendo proceso...", "error")
        self.btn_cancelar.config(bg="#333333", fg="#888888")
        self.btn_cancelar.unbind("<Button-1>")
            
    def iniciar_hilo(self, modo="normal"):
        self.cancel_flag = False
        self.btn_iniciar.config(bg="#242424", fg="#666666")
        self.btn_iniciar.unbind("<Button-1>")
        self.btn_rescue.config(bg="#242424", fg="#666666")
        self.btn_rescue.unbind("<Button-1>")
        self.btn_acustico.config(bg="#242424", fg="#666666")
        self.btn_acustico.unbind("<Button-1>")
        
        self.btn_cancelar.config(bg="#FF3333", fg="#FFFFFF", state="normal")
        self.btn_cancelar.bind("<Button-1>", lambda e: self.cancelar_hilo())
        
        self.lbl_wave.config(fg="#FFAA00" if modo == "acustico" else "#00AEEF")
        threading.Thread(target=self.procesar_biblioteca, args=(modo,), daemon=True).start()
        
    def procesar_biblioteca(self, modo):
        ruta_base = self.entry_ruta.get()
        archivos_mp3 = []
        is_safe_mode = self.safe_mode_var.get()
        
        for root_dir, dirs, files in os.walk(ruta_base):
            for file in files:
                if not file.lower().endswith('.mp3'): continue
                
                if modo == "rescate":
                    condicion_vacio = bool(re.search(r'^\s*-\s*\.mp3', file))
                    condicion_unknown = "VRC_Unidentified" in file or "VRC_MISSING" in file
                    condicion_revision = "Revision_Manual" in root_dir
                    if condicion_vacio or condicion_unknown or condicion_revision:
                        archivos_mp3.append(os.path.join(root_dir, file))
                else:
                    archivos_mp3.append(os.path.join(root_dir, file))
                    
        total = len(archivos_mp3)
        if total == 0:
            if modo == "rescate": self.log("[+] No se encontraron archivos rotos. Biblioteca limpia.", "success")
            else: self.log("[!] No se encontraron archivos MP3 en la ruta indicada.", "error")
            self._reset_ui()
            return
            
        self.progreso["maximum"] = total
        
        if modo == "rescate":
            self.log(f"[ RESCATE SHAZAM INICIADO ] Analizando {total} archivos con huella acústica.\n", "shazam")
        elif modo == "acustico":
            self.log(f"[ ANÁLISIS ACÚSTICO PROFUNDO ] Extrayendo energía y recortando silencios en {total} pistas.\n", "warning")
        else:
            self.log(f"[ ANÁLISIS ESTÁNDAR ] Procesando metadatos y géneros en {total} pistas.\n", "info")
            
        if not is_safe_mode and modo != "acustico":
            for carpeta in CARPETAS_DESTINO:
                ruta_dir = os.path.join(ruta_base, carpeta)
                if not os.path.exists(ruta_dir):
                    os.makedirs(ruta_dir)
                
        procesadas = 0
        for ruta_completa in archivos_mp3:
            if self.cancel_flag:
                self.log("\n[ PROCESO ABORTADO POR EL USUARIO ]", "error")
                break
                
            procesadas += 1
            nombre_archivo = os.path.basename(ruta_completa)
            
            self.root.after(0, lambda n=nombre_archivo: self.lbl_file.config(text=f"ARCHIVO: {n[:55]}..."))
            self.root.after(0, lambda: self.lbl_id3.config(text="ETIQUETA ID3: LEYENDO...", fg="#888888"))
            
            try:
                # --- MÓDULO 3: ANÁLISIS ACÚSTICO AISLADO ---
                if modo == "acustico":
                    self.log(f"[{procesadas}/{total}] Analizando acústica y recortando silencios: {nombre_archivo}", "warning")
                    bpm, energia, groove = analizar_acustica_profunda(ruta_completa)
                    
                    if not is_safe_mode:
                        try:
                            tags = EasyID3(ruta_completa)
                            tags['bpm'] = str(int(bpm))
                            tags['comment'] = f"Energía: {energia}% | Groove: {groove}% | CleanDJmix PRO"
                            tags.save(ruta_completa)
                        except:
                            pass
                            
                    self.root.after(0, lambda b=bpm, e=energia, g=groove: self.lbl_stats.config(text=f"BPM: {b}  |  ENERGÍA: {e}%  |  GROOVE: {g}%"))
                    self.log(f"   -> [ACÚSTICA OK] BPM: {bpm} | Energía: {energia}% | Groove: {groove}%", "success")
                    self.root.after(0, lambda p=procesadas: self.progreso.configure(value=p))
                    continue

                # --- MÓDULO 1 Y 2: ESTÁNDAR Y RESCATE ---
                artista_sucio, titulo_sucio = obtener_metadatos_limpios(ruta_completa, nombre_archivo)
                
                if modo == "rescate" or (artista_sucio == "VRC_MISSING" and titulo_sucio == "VRC_MISSING"):
                    self.log(f"   -> [SHAZAM] Escuchando huella acústica: {nombre_archivo}", "warning")
                    art_shz, tit_shz = rescate_shazam(ruta_completa)
                    if art_shz != "VRC_MISSING":
                        self.log(f"   -> [SHAZAM ÉXITO] Identificado: {art_shz} - {tit_shz}", "shazam")
                        artista_sucio, titulo_sucio = art_shz, tit_shz
                    else:
                        self.log(f"   -> [SHAZAM FALLO] No se pudo identificar la onda.", "error")
                
                time.sleep(1.0)
                
                año, estilos, art_oficial, tit_oficial = buscar_discogs_oficial(artista_sucio, titulo_sucio)
                
                self.root.after(0, lambda a=art_oficial, t=tit_oficial: self.lbl_id3.config(text=f"ID3 TAG: {a} - {t}"[:65], fg="#FFFFFF"))
                
                # Análisis ligero para la clasificación de Ishkur
                y, sr = librosa.load(ruta_completa, sr=44100, duration=30.0)
                tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
                bpm = round(tempo[0], 2) if isinstance(tempo, (list, np.ndarray)) else round(tempo, 2)
                
                nuevo_nombre_archivo = corregir_etiquetas_y_nombre(ruta_completa, art_oficial, tit_oficial, año, bpm, modo_seguro=is_safe_mode)
                
                if nuevo_nombre_archivo != nombre_archivo:
                    accion_tag = "[SIMULACIÓN ID3]" if is_safe_mode else "[ID3 REESCRITO]"
                    self.log(f"[{procesadas}/{total}] {accion_tag}: {nombre_archivo} -> {nuevo_nombre_archivo}", "tag")
                
                zcr = np.mean(librosa.feature.zero_crossing_rate(y))
                centroide = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
                mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
                presencia_vocal = np.mean(np.var(mfcc[1:13], axis=1))
                
                categoria = cerebro_ishkur(bpm, año, estilos, presencia_vocal, zcr, centroide)
                ruta_destino = os.path.join(ruta_base, categoria, nuevo_nombre_archivo)
                
                self.root.after(0, lambda b=bpm, y=año, c=categoria: self.lbl_stats.config(text=f"BPM: {b}  |  AÑO: {y}  |  GÉNERO: {c}"))
                
                if is_safe_mode:
                    self.log(f"   -> [SIMULACRO] Se movería a la carpeta: {categoria}", "simulacro")
                else:
                    if ruta_completa != ruta_destino:
                        shutil.move(ruta_completa, ruta_destino)
                        self.log(f"   -> [REUBICADO] a la carpeta {categoria}", "success")
                    else:
                        self.log(f"   -> [CONFIRMADO] en la carpeta {categoria}", "info")
                        
            except Exception as e:
                traza = traceback.format_exc()
                logging.error(f"Fallo procesando {nombre_archivo}:\n{traza}")
                self.log(f"[{procesadas}/{total}] -> [!] Error crítico: {nombre_archivo}", "error")
                self.log(f"   -> Registrado en 'CleanDJmix_crash.log'. Puedes reportarlo a {DEV_CONTACT}. ¡Gracias por colaborar!", "warning")
                
                if not is_safe_mode and modo != "acustico":
                    try:
                        ruta_err = os.path.join(ruta_base, "Revision_Manual", nombre_archivo)
                        if ruta_completa != ruta_err:
                            shutil.move(ruta_completa, ruta_err)
                    except:
                        pass
                    
            self.root.after(0, lambda p=procesadas: self.progreso.configure(value=p))
            
        if not self.cancel_flag:
            self.log("\n[!!!] OPERACIÓN MAESTRA FINALIZADA.", "success")
            
        self._reset_ui()
        
    def _reset_ui(self):
        self.root.after(0, lambda: self.btn_iniciar.config(bg="#00AEEF", fg="#000000"))
        self.root.after(0, lambda: self.btn_iniciar.bind("<Button-1>", lambda e: self.iniciar_hilo(modo="normal")))
        self.root.after(0, lambda: self.btn_rescue.config(bg="#242424", fg="#00AEEF"))
        self.root.after(0, lambda: self.btn_rescue.bind("<Button-1>", lambda e: self.iniciar_hilo(modo="rescate")))
        self.root.after(0, lambda: self.btn_acustico.config(bg="#242424", fg="#FFAA00"))
        self.root.after(0, lambda: self.btn_acustico.bind("<Button-1>", lambda e: self.iniciar_hilo(modo="acustico")))
        self.root.after(0, lambda: self.btn_cancelar.config(bg="#333333", fg="#888888", state="disabled"))
        self.root.after(0, lambda: self.btn_cancelar.unbind("<Button-1>"))
        self.root.after(0, lambda: self.lbl_wave.config(fg="#333333"))
        self.root.after(0, lambda: self.lbl_file.config(text="ARCHIVO: ESPERANDO PISTA..."))
        self.root.after(0, lambda: self.lbl_id3.config(text="ETIQUETA ID3: EN ESPERA", fg="#FFFFFF"))

if __name__ == "__main__":
    root = tk.Tk()
    app = AplicacionDJ(root)
    root.mainloop()
