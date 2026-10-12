import os
import shutil
import threading
import time
import traceback
import logging
import tkinter as tk
from tkinter import filedialog, scrolledtext, ttk
from domain.models import TrackDomain
from infrastructure.adapters import AudioAdapter, CARPETAS_DESTINO, DEV_CONTACT

logging.basicConfig(filename='CleanDJmix_crash.log', level=logging.ERROR, format='%(asctime)s - [CleanDJmix Error] - %(message)s')

class CleanDJmixApp:
    def __init__(self, root):
        self.root = root
        self.root.title("CleanDJmix PRO by Victor Rueda (Hexagonal)")
        self.root.geometry("1024x900")
        self.root.resizable(False, False)
        self.root.configure(bg="#181818")
        
        self.safe_mode_var = tk.BooleanVar(value=True)
        self.cancel_flag = False 
        
        # Mapeo personalizado de destinos por género (Género -> {carpeta, ruta})
        self.destinos_personalizados = {
            "Techno": {"carpeta": "Techno", "ruta": ""},
            "Tech House": {"carpeta": "Tech House", "ruta": ""},
            "Remember": {"carpeta": "Remember", "ruta": ""},
            "Cantaditas": {"carpeta": "Cantaditas", "ruta": ""},
            "Trance": {"carpeta": "Trance", "ruta": ""},
            "House": {"carpeta": "House", "ruta": ""}
        }
        
        main_container = tk.Frame(root, bg="#181818")
        main_container.pack(fill=tk.BOTH, expand=True, padx=30, pady=20)
        
        header_frame = tk.Frame(main_container, bg="#181818")
        header_frame.pack(fill=tk.X, pady=(0, 10))
        tk.Label(header_frame, text="CleanDJmix PRO", font=("Helvetica Neue", 28, "bold"), bg="#181818", fg="#FFFFFF").pack(side=tk.LEFT)
        
        badge_frame = tk.Frame(header_frame, bg="#181818")
        badge_frame.pack(side=tk.RIGHT)
        tk.Label(badge_frame, text="POR VICTOR RUEDA", font=("Helvetica Neue", 10, "bold"), bg="#242424", fg="#00AEEF").pack(side=tk.TOP, fill=tk.X, pady=(0,2), ipady=2)
        tk.Label(badge_frame, text="v2.3 CUSTOM DESTINATIONS", font=("Helvetica Neue", 9, "bold"), bg="#181818", fg="#666666").pack(side=tk.BOTTOM)
        
        # Panel de Ruta de Origen
        ruta_frame = tk.Frame(main_container, bg="#242424", bd=0, relief="flat")
        ruta_frame.pack(fill=tk.X, pady=8)
        tk.Label(ruta_frame, text="CARPETA ORIGEN", font=("Helvetica Neue", 10, "bold"), bg="#242424", fg="#888888").pack(side=tk.LEFT, padx=15, pady=12)
        
        self.entry_ruta = tk.Entry(ruta_frame, bg="#1e1e1e", fg="#FFFFFF", font=("Courier", 12), insertbackground="white", relief="flat", highlightthickness=1, highlightbackground="#333333")
        self.entry_ruta.insert(0, "/Users/admin/Music/mi musica/")
        self.entry_ruta.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=10, ipady=5)
        
        self.btn_ruta = tk.Label(ruta_frame, text=" EXPLORAR ", bg="#333333", fg="#FFFFFF", font=("Helvetica Neue", 10, "bold"), cursor="hand2")
        self.btn_ruta.pack(side=tk.RIGHT, padx=15, ipadx=10, ipady=5)
        self.btn_ruta.bind("<Button-1>", lambda e: self.seleccionar_ruta())

        # Botón para abrir el selector de destinos personalizados
        config_destinos_frame = tk.Frame(main_container, bg="#181818")
        config_destinos_frame.pack(fill=tk.X, pady=5)
        self.btn_config_destinos = tk.Label(config_destinos_frame, text="⚙️ [ CONFIGURAR CARPETAS Y RUTAS DE DESTINO POR GÉNERO ]", bg="#242424", fg="#00AEEF", font=("Helvetica Neue", 10, "bold"), cursor="hand2")
        self.btn_config_destinos.pack(fill=tk.X, ipady=8, ipadx=10)
        self.btn_config_destinos.bind("<Button-1>", lambda e: self.abrir_ventana_destinos())
        
        # Pantalla LCD / Estadísticas
        self.lcd_frame = tk.Frame(main_container, bg="#111111", bd=0, relief="flat")
        self.lcd_frame.pack(fill=tk.X, pady=10)
        
        self.lbl_file = tk.Label(self.lcd_frame, text="ARCHIVO: ESPERANDO PISTA...", font=("Menlo", 11), bg="#111111", fg="#666666")
        self.lbl_file.pack(pady=(15, 0), fill=tk.X)
        self.lbl_id3 = tk.Label(self.lcd_frame, text="ETIQUETA ID3: EN ESPERA", font=("Menlo", 14, "bold"), bg="#111111", fg="#FFFFFF")
        self.lbl_id3.pack(pady=(5, 5), fill=tk.X)
        self.lbl_wave = tk.Label(self.lcd_frame, text="ılıılıılıılıılıılıılıılıılıılıılıılıılıılıılıılıılıılıılıılıılı", font=("Arial", 16), bg="#111111", fg="#333333")
        self.lbl_wave.pack(pady=2)
        self.lbl_stats = tk.Label(self.lcd_frame, text="BPM: 000.00  |  AÑO: 0000  |  GÉNERO: PENDIENTE", font=("Courier", 14, "bold"), bg="#111111", fg="#00AEEF")
        self.lbl_stats.pack(pady=(5, 15), fill=tk.X)
        
        safe_mode_cb = tk.Checkbutton(main_container, text="MODO SEGURO (Simulación: No modifica archivos físicos)", 
                                      variable=self.safe_mode_var, bg="#181818", fg="#AAAAAA", selectcolor="#242424", 
                                      activebackground="#181818", activeforeground="#FFFFFF", font=("Helvetica Neue", 10))
        safe_mode_cb.pack(pady=(0, 8))
        
        style = ttk.Style()
        style.theme_use('default')
        style.configure("TProgressbar", thickness=6, background="#00AEEF", troughcolor="#242424", borderwidth=0)
        self.progreso = ttk.Progressbar(main_container, orient="horizontal", mode="determinate", style="TProgressbar")
        self.progreso.pack(fill=tk.X, pady=(0, 10))
        
        botones_frame = tk.Frame(main_container, bg="#181818")
        botones_frame.pack(fill=tk.X, pady=5)
        
        self.btn_iniciar = tk.Label(botones_frame, text="[ ANÁLISIS ESTÁNDAR ]", bg="#00AEEF", fg="#000000", font=("Helvetica Neue", 10, "bold"), cursor="hand2")
        self.btn_iniciar.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=10, padx=(0, 3))
        self.btn_iniciar.bind("<Button-1>", lambda e: self.iniciar_hilo(modo="normal"))
        
        self.btn_rescue = tk.Label(botones_frame, text="[ RESCATE SHAZAM ]", bg="#242424", fg="#00AEEF", font=("Helvetica Neue", 10, "bold"), cursor="hand2")
        self.btn_rescue.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=10, padx=(3, 3))
        self.btn_rescue.bind("<Button-1>", lambda e: self.iniciar_hilo(modo="rescate"))

        self.btn_acustico = tk.Label(botones_frame, text="[ ANÁLISIS ACÚSTICO ]", bg="#242424", fg="#FFAA00", font=("Helvetica Neue", 10, "bold"), cursor="hand2")
        self.btn_acustico.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=10, padx=(3, 3))
        self.btn_acustico.bind("<Button-1>", lambda e: self.iniciar_hilo(modo="acustico"))
        
        self.consola = scrolledtext.ScrolledText(main_container, bg="#111111", fg="#AAAAAA", font=("Menlo", 10), bd=0, relief="flat", highlightthickness=0)
        self.consola.pack(fill=tk.BOTH, expand=True, pady=(10, 0))
        
        self.consola.tag_config("info", foreground="#00AEEF")
        self.consola.tag_config("error", foreground="#FF3333")
        self.consola.tag_config("success", foreground="#FFFFFF")
        self.consola.tag_config("tag", foreground="#AAAAAA")
        self.consola.tag_config("simulacro", foreground="#FF00FF")
        self.consola.tag_config("warning", foreground="#FFAA00")
        
        self.log("CleanDJmix PRO (Módulo de Destinos Personalizados) listo.\n", "info")
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

    def abrir_ventana_destinos(self):
        """Abre una ventana flotante para configurar nombres de carpeta y rutas destino por género."""
        ventana = tk.Toplevel(self.root)
        ventana.title("Configuración de Destinos Personalizados")
        ventana.geometry("650x450")
        ventana.configure(bg="#181818")
        ventana.transient(self.root)
        ventana.grab_set()

        tk.Label(ventana, text="Personaliza carpetas y rutas de destino por género", font=("Helvetica Neue", 13, "bold"), bg="#181818", fg="#FFFFFF").pack(pady=15)

        frame_list = tk.Frame(ventana, bg="#181818")
        frame_list.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)

        entries = {}
        row = 0
        for genero, data in self.destinos_personalizados.items():
            tk.Label(frame_list, text=f"Género: {genero}", font=("Helvetica Neue", 11, "bold"), bg="#181818", fg="#00AEEF", width=15, anchor="w").grid(row=row, column=0, sticky="w", pady=5)
            
            tk.Label(frame_list, text="Carpeta:", bg="#181818", fg="#AAAAAA").grid(row=row, column=1, sticky="w")
            e_carp = tk.Entry(frame_list, bg="#242424", fg="#FFFFFF", insertbackground="white", width=15)
            e_carp.insert(0, data["carpeta"])
            e_carp.grid(row=row, column=2, padx=5)

            tk.Label(frame_list, text="Ruta:", bg="#181818", fg="#AAAAAA").grid(row=row, column=3, sticky="w")
            e_ruta = tk.Entry(frame_list, bg="#242424", fg="#FFFFFF", insertbackground="white", width=25)
            e_ruta.insert(0, data["ruta"])
            e_ruta.grid(row=row, column=4, padx=5)

            def elegir_dir(entry=e_ruta):
                d = filedialog.askdirectory()
                if d:
                    entry.delete(0, tk.END)
                    entry.insert(0, d)

            btn_dir = tk.Button(frame_list, text="📁", command=elegir_dir, bg="#333333", fg="#FFFFFF", relief="flat")
            btn_dir.grid(row=row, column=5)

            entries[genero] = (e_carp, e_ruta)
            row += 1

        def guardar():
            for g, (ec, er) in entries.items():
                self.destinos_personalizados[g]["carpeta"] = ec.get().strip() or g
                self.destinos_personalizados[g]["ruta"] = er.get().strip()
            self.log("[i] Configuración de destinos personalizados guardada.", "info")
            ventana.destroy()

        btn_guardar = tk.Button(ventana, text="GUARDAR CONFIGURACIÓN", command=guardar, bg="#00AEEF", fg="#000000", font=("Helvetica Neue", 11, "bold"), relief="flat", padx=20, pady=10)
        btn_guardar.pack(pady=20)

    def iniciar_hilo(self, modo="normal"):
        self.cancel_flag = False
        threading.Thread(target=self.procesar_biblioteca, args=(modo,), daemon=True).start()
        
    def procesar_biblioteca(self, modo):
        ruta_base = self.entry_ruta.get()
        archivos_mp3 = []
        is_safe_mode = self.safe_mode_var.get()
        
        for root_dir, dirs, files in os.walk(ruta_base):
            for file in files:
                if not file.lower().endswith('.mp3'): continue
                if modo == "rescate":
                    if re.search(r'^\s*-\s*\.mp3', file) or "VRC_Unidentified" in file or "VRC_MISSING" in file or "Revision_Manual" in root_dir:
                        archivos_mp3.append(os.path.join(root_dir, file))
                else:
                    archivos_mp3.append(os.path.join(root_dir, file))
                    
        total = len(archivos_mp3)
        if total == 0:
            self.log("[!] No se encontraron archivos MP3.", "error")
            return
            
        self.progreso["maximum"] = total
        self.log(f"[ MÓDULO {modo.upper()} ] Procesando {total} pistas con destinos personalizados...", "info")
        
        procesadas = 0
        for ruta_completa in archivos_mp3:
            if self.cancel_flag: break
            procesadas += 1
            nombre_archivo = os.path.basename(ruta_completa)
            
            try:
                if modo == "acustico":
                    bpm, energia, groove, _, _, _ = AudioAdapter.analizar_acustica(ruta_completa)
                    self.log(f"[{procesadas}/{total}] Acústica OK: {nombre_archivo} -> BPM: {bpm} | Energía: {energia}%", "success")
                    continue

                artista, titulo = AudioAdapter.obtener_metadatos_id3(ruta_completa, nombre_archivo)
                if modo == "rescate" or (artista == "VRC_MISSING" and titulo == "VRC_MISSING"):
                    artista, titulo = AudioAdapter.rescate_shazam(ruta_completa)
                
                año, estilos, art_oficial, tit_oficial = AudioAdapter.buscar_discogs(artista, titulo)
                bpm, energia, groove, presencia_vocal, zcr, centroide = AudioAdapter.analizar_acustica(ruta_completa)
                
                nuevo_nombre = AudioAdapter.actualizar_fichero(ruta_completa, art_oficial, tit_oficial, año, bpm, is_safe_mode)
                categoria = TrackDomain.cerebro_ishkur(bpm, año, estilos, presencia_vocal, zcr, centroide)
                
                # Obtener configuración personalizada de destino para el género detectado
                config_dest = self.destinos_personalizados.get(categoria, {"carpeta": categoria, "ruta": ""})
                nombre_carpeta_destino = config_dest["carpeta"]
                ruta_custom_base = config_dest["ruta"]
                
                # Si hay ruta personalizada, usarla; si no, usar la ruta base de origen
                base_salida = ruta_custom_base if ruta_custom_base else ruta_base
                ruta_destino = os.path.join(base_salida, nombre_carpeta_destino, nuevo_nombre)
                
                if not is_safe_mode and ruta_completa != ruta_destino:
                    os.makedirs(os.path.dirname(ruta_destino), exist_ok=True)
                    shutil.move(ruta_completa, ruta_destino)
                    self.log(f"[{procesadas}/{total}] Movido a [{nombre_carpeta_destino}]: {nuevo_nombre}", "success")
                else:
                    self.log(f"[{procesadas}/{total}] Simulacro en [{nombre_carpeta_destino}]: {nuevo_nombre}", "simulacro")
            except Exception as e:
                logging.error(traceback.format_exc())
                self.log(f"[!] Error en {nombre_archivo}", "error")
                
            self.progreso.configure(value=procesadas)
            
        self.log("\n[!!!] PROCESO FINALIZADO.", "success")
