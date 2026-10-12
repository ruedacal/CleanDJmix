"""
Módulo de Interfaz Gráfica (UI): Diseñado con CustomTkinter para ofrecer 
una experiencia moderna, intuitiva y en modo oscuro estilo profesional de DJ,
incorporando tooltips informativos robustos y visibles en todo momento.
"""

import os
import shutil
import threading
import traceback
import logging
import customtkinter as ctk
from tkinter import filedialog
from domain.models import TrackDomain, TAXONOMIA_ELECTRONICA
from infrastructure.adapters import AudioAdapter

# Configuración global de CustomTkinter
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

logging.basicConfig(filename='CleanDJmix_crash.log', level=logging.ERROR, format='%(asctime)s - [CleanDJmix Error] - %(message)s')

class CTkToolTip:
    """Clase robusta para mostrar tooltips informativos flotantes al pasar el ratón."""
    def __init__(self, widget, text):
        self.widget = widget
        self.text = text
        self.tipwindow = None
        self.widget.bind("<Enter>", self.show_tip, add="+")
        self.widget.bind("<Leave>", self.hide_tip, add="+")

    def show_tip(self, event=None):
        if self.tipwindow or not self.text:
            return
        try:
            x = self.widget.winfo_rootx() + 25
            y = self.widget.winfo_rooty() + self.widget.winfo_height() + 5
            
            self.tipwindow = tw = ctk.CTkToplevel(self.widget)
            tw.wm_overrideredirect(True)
            tw.wm_geometry(f"+{x}+{y}")
            tw.attributes("-topmost", True)
            
            label = ctk.CTkLabel(
                tw, 
                text=self.text, 
                fg_color="#2b2b2b", 
                text_color="#00AEEF", 
                corner_radius=6, 
                font=("Helvetica", 11, "bold"), 
                padx=10, 
                pady=6
            )
            label.pack()
        except Exception:
            pass

    def hide_tip(self, event=None):
        tw = self.tipwindow
        self.tipwindow = None
        if tw:
            try:
                tw.destroy()
            except Exception:
                pass


class CleanDJmixApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        self.title("CleanDJmix PRO - Arquitectura Hexagonal & Taxonomía Avanzada")
        self.geometry("1100x750")
        self.resizable(False, False)
        
        self.safe_mode_var = ctk.BooleanVar(value=True)
        self.cancel_flag = False 
        
        # Estructura de destinos personalizados por género y subgénero
        self.destinos_personalizados = {}
        for genero, subgeneros in TAXONOMIA_ELECTRONICA.items():
            self.destinos_personalizados[genero] = {
                "carpeta": genero,
                "ruta": "",
                "subgeneros": {sub: {"carpeta": sub, "ruta": ""} for sub in subgeneros}
            }

        # Contenedor Principal con Pestañas (Tabs)
        self.tabview = ctk.CTkTabview(self, fg_color="#181818", segmented_button_selected_color="#00AEEF", segmented_button_unselected_color="#242424")
        self.tabview.pack(fill="both", expand=True, padx=20, pady=20)
        
        self.tab_control = self.tabview.add("Control y Analisis")
        self.tab_destinos = self.tabview.add("Destinos y Taxonomia")
        self.tab_logs = self.tabview.add("Consola y Logs")
        
        self._construir_pestana_control()
        self._construir_pestana_destinos()
        self._construir_pestana_logs()
        
        self.log("CleanDJmix PRO Modern UI con Tooltips robustos inicializado correctamente.\n", "info")

    def _construir_pestana_control(self):
        """Construye la pestaña principal de ejecución y monitorización."""
        header = ctk.CTkFrame(self.tab_control, fg_color="transparent")
        header.pack(fill="x", pady=(0, 15))
        ctk.CTkLabel(header, text="CleanDJmix PRO", font=ctk.CTkFont(family="Helvetica", size=26, weight="bold"), text_color="#FFFFFF").pack(side="left")
        ctk.CTkLabel(header, text="MODERN DJ SUITE v3.0", font=ctk.CTkFont(family="Helvetica", size=11, weight="bold"), text_color="#00AEEF").pack(side="right")

        # Selector de Carpeta Origen
        src_frame = ctk.CTkFrame(self.tab_control, fg_color="#242424", corner_radius=8)
        src_frame.pack(fill="x", pady=10, ipady=5)
        ctk.CTkLabel(src_frame, text="CARPETA ORIGEN", font=ctk.CTkFont(size=11, weight="bold"), text_color="#888888").pack(side="left", padx=15)
        
        self.entry_ruta = ctk.CTkEntry(src_frame, width=600, height=35, fg_color="#1e1e1e", text_color="#FFFFFF", font=("Courier", 12))
        self.entry_ruta.insert(0, "/Users/admin/Music/mi musica/")
        self.entry_ruta.pack(side="left", padx=10, expand=True, fill="x")
        
        btn_browse = ctk.CTkButton(src_frame, text="Explorar", command=self.seleccionar_ruta, fg_color="#333333", hover_color="#444444", width=90, height=35)
        btn_browse.pack(side="right", padx=15)
        CTkToolTip(btn_browse, "Haz clic para seleccionar la carpeta raíz con tu música")

        # Pantalla LCD / Visualizador de Estado
        lcd = ctk.CTkFrame(self.tab_control, fg_color="#111111", corner_radius=10)
        lcd.pack(fill="x", pady=15, ipady=10)
        
        self.lbl_file = ctk.CTkLabel(lcd, text="ARCHIVO: ESPERANDO PISTA...", font=("Menlo", 11), text_color="#666666")
        self.lbl_file.pack(pady=(15, 2))
        self.lbl_id3 = ctk.CTkLabel(lcd, text="ETIQUETA ID3: EN ESPERA", font=("Menlo", 14, "bold"), text_color="#FFFFFF")
        self.lbl_id3.pack(pady=2)
        ctk.CTkLabel(lcd, text="--------------------------------------------------", font=("Arial", 14), text_color="#333333").pack(pady=2)
        self.lbl_stats = ctk.CTkLabel(lcd, text="BPM: 000.00  |  GENERO: PENDIENTE  |  SUBGENERO: PENDIENTE", font=("Courier", 13, "bold"), text_color="#00AEEF")
        self.lbl_stats.pack(pady=(2, 15))

        # Checkbox de Modo Seguro
        safe_cb = ctk.CTkCheckBox(self.tab_control, text="Modo Seguro (Simulación: No modifica ficheros físicos en disco)", variable=self.safe_mode_var, text_color="#AAAAAA", fg_color="#00AEEF")
        safe_cb.pack(pady=(0, 10), anchor="w")
        CTkToolTip(safe_cb, "Ayuda: Simula el proceso en consola sin mover ni alterar archivos reales")

        # Barra de Progreso
        self.progreso = ctk.CTkProgressBar(self.tab_control, progress_color="#00AEEF", fg_color="#242424", height=8)
        self.progreso.pack(fill="x", pady=(0, 20))
        self.progreso.set(0)

        # Botones de Acción Operativa con Tooltips Informativos
        btn_frame = ctk.CTkFrame(self.tab_control, fg_color="transparent")
        btn_frame.pack(fill="x", pady=5)
        
        btn_std = ctk.CTkButton(btn_frame, text="Analisis Estandar", command=lambda: self.iniciar_hilo("normal"), fg_color="#00AEEF", text_color="#000000", font=ctk.CTkFont(weight="bold"), height=42)
        btn_std.pack(side="left", expand=True, fill="x", padx=(0, 5))
        CTkToolTip(btn_std, "Acción: Procesa metadatos ID3, Discogs y clasifica por el Cerebro Ishkur")

        btn_resc = ctk.CTkButton(btn_frame, text="Rescate Shazam", command=lambda: self.iniciar_hilo("rescate"), fg_color="#242424", text_color="#00AEEF", hover_color="#333333", font=ctk.CTkFont(weight="bold"), height=42)
        btn_resc.pack(side="left", expand=True, fill="x", padx=5)
        CTkToolTip(btn_resc, "Acción: Identifica temas desconocidos mediante reconocimiento online de Shazam")

        btn_acu = ctk.CTkButton(btn_frame, text="Analisis Acustico", command=lambda: self.iniciar_hilo("acustico"), fg_color="#242424", text_color="#FFAA00", hover_color="#333333", font=ctk.CTkFont(weight="bold"), height=42)
        btn_acu.pack(side="left", expand=True, fill="x", padx=(5, 0))
        CTkToolTip(btn_acu, "Acción: Analiza métricas puras de audio (BPM, energía y centroide) con Librosa")

    def _construir_pestana_destinos(self):
        """Construye el panel avanzado para configurar carpetas y rutas por género y subgénero."""
        ctk.CTkLabel(self.tab_destinos, text="Configuracion Avanzada de Destinos y Taxonomia", font=ctk.CTkFont(size=16, weight="bold"), text_color="#FFFFFF").pack(pady=10)
        ctk.CTkLabel(self.tab_destinos, text="Personaliza el nombre de las carpetas de salida y las rutas de disco para cada género y subgénero.", font=ctk.CTkFont(size=11), text_color="#888888").pack(pady=(0, 10))

        scroll = ctk.CTkScrollableFrame(self.tab_destinos, fg_color="#1e1e1e", height=480)
        scroll.pack(fill="both", expand=True, padx=5, pady=5)

        self.widgets_destinos = {}

        for genero, data in self.destinos_personalizados.items():
            g_frame = ctk.CTkFrame(scroll, fg_color="#242424", corner_radius=6)
            g_frame.pack(fill="x", pady=5, padx=5, ipady=5)
            
            ctk.CTkLabel(g_frame, text=f"Genero Madre: {genero}", font=ctk.CTkFont(size=13, weight="bold"), text_color="#00AEEF").pack(anchor="w", padx=10, pady=5)
            
            sub_container = ctk.CTkFrame(g_frame, fg_color="transparent")
            sub_container.pack(fill="x", padx=15, pady=2)
            
            self.widgets_destinos[genero] = {}
            for sub in TAXONOMIA_ELECTRONICA[genero]:
                s_frame = ctk.CTkFrame(sub_container, fg_color="#181818", corner_radius=4)
                s_frame.pack(fill="x", pady=3, ipady=3)
                
                lbl_sub = ctk.CTkLabel(s_frame, text=sub, font=ctk.CTkFont(size=11), text_color="#CCCCCC", width=140, anchor="w")
                lbl_sub.pack(side="left", padx=10)
                CTkToolTip(lbl_sub, f"Subgénero perteneciente a la categoría {genero}")
                
                e_carp = ctk.CTkEntry(s_frame, width=140, height=28, fg_color="#242424", text_color="#FFFFFF")
                e_carp.insert(0, sub)
                e_carp.pack(side="left", padx=5)
                CTkToolTip(e_carp, "Nombre de la carpeta de salida que se creará para este subgénero")
                
                e_ruta = ctk.CTkEntry(s_frame, width=280, height=28, fg_color="#242424", text_color="#FFFFFF", placeholder_text="Ruta opcional (por defecto origen)")
                e_ruta.pack(side="left", padx=5, expand=True, fill="x")
                CTkToolTip(e_ruta, "Ruta absoluta de destino (disco duro externo o USB) para este subgénero")
                
                def elegir_path(entry=e_ruta):
                    d = filedialog.askdirectory()
                    if d:
                        entry.delete(0, "end")
                        entry.insert(0, d)
                
                btn_d = ctk.CTkButton(s_frame, text="Dir", command=elegir_path, width=32, height=28, fg_color="#333333")
                btn_d.pack(side="right", padx=10)
                CTkToolTip(btn_d, "Explorar y seleccionar directorio o unidad de destino")
                
                self.widgets_destinos[genero][sub] = {"carpeta": e_carp, "ruta": e_ruta}

    def _construir_pestana_logs(self):
        """Construye la pestaña de consola con diseño estilizado."""
        ctk.CTkLabel(self.tab_logs, text="Registro de Ejecucion en Tiempo Real", font=ctk.CTkFont(size=14, weight="bold"), text_color="#FFFFFF").pack(pady=10, anchor="w", padx=5)
        
        self.consola = ctk.CTkTextbox(self.tab_logs, fg_color="#111111", text_color="#00AEEF", font=("Menlo", 11), corner_radius=8)
        self.consola.pack(fill="both", expand=True, padx=5, pady=5)

    def log(self, mensaje, tag="info"):
        if hasattr(self, 'consola'):
            self.consola.insert("end", mensaje + "\n")
            self.consola.see("end")
        print(f"[{tag.upper()}] {mensaje}")

    def seleccionar_ruta(self):
        ruta = filedialog.askdirectory()
        if ruta:
            self.entry_ruta.delete(0, "end")
            self.entry_ruta.insert(0, ruta)

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
                    if re.search(r'^\s*-\s*\.mp3', file) or "VRC_Unidentified" in file or "VRC_MISSING" in file:
                        archivos_mp3.append(os.path.join(root_dir, file))
                else:
                    archivos_mp3.append(os.path.join(root_dir, file))
                    
        total = len(archivos_mp3)
        if total == 0:
            self.log("[!] No se encontraron archivos MP3.", "error")
            return
            
        self.log(f"[ MODULO {modo.upper()} ] Procesando {total} pistas...", "info")
        
        procesadas = 0
        for ruta_completa in archivos_mp3:
            if self.cancel_flag: break
            procesadas += 1
            nombre_archivo = os.path.basename(ruta_completa)
            
            try:
                if modo == "acustico":
                    bpm, energia, _, _, _, _ = AudioAdapter.analizar_acustica(ruta_completa)
                    self.log(f"[{procesadas}/{total}] Acustica OK: {nombre_archivo} -> BPM: {bpm} | Energia: {energia}%", "success")
                    continue

                artista, titulo = AudioAdapter.obtener_metadatos_id3(ruta_completa, nombre_archivo)
                if modo == "rescate" or (artista == "VRC_MISSING" and titulo == "VRC_MISSING"):
                    artista, titulo = AudioAdapter.rescate_shazam(ruta_completa)
                
                año, estilos, art_oficial, tit_oficial = AudioAdapter.buscar_discogs(artista, titulo)
                bpm, energia, groove, presencia_vocal, zcr, centroide = AudioAdapter.analizar_acustica(ruta_completa)
                
                nuevo_nombre = AudioAdapter.actualizar_fichero(ruta_completa, art_oficial, tit_oficial, año, bpm, is_safe_mode)
                genero, subgenero = TrackDomain.cerebro_ishkur(bpm, año, estilos, presencia_vocal, zcr, centroide)
                
                sub_config = self.widgets_destinos.get(genero, {}).get(subgenero, {"carpeta": None, "ruta": None})
                nombre_carpeta = sub_config["carpeta"].get().strip() if sub_config["carpeta"] else subgenero
                ruta_custom = sub_config["ruta"].get().strip() if sub_config["ruta"] else ""
                
                base_salida = ruta_custom if ruta_custom else ruta_base
                ruta_destino = os.path.join(base_salida, nombre_carpeta, nuevo_nombre)
                
                if not is_safe_mode and ruta_completa != ruta_destino:
                    os.makedirs(os.path.dirname(ruta_destino), exist_ok=True)
                    shutil.move(ruta_completa, ruta_destino)
                    self.log(f"[{procesadas}/{total}] Movido a [{genero} -> {nombre_carpeta}]: {nuevo_nombre}", "success")
                else:
                    self.log(f"[{procesadas}/{total}] Simulacro en [{genero} -> {nombre_carpeta}]: {nuevo_nombre}", "info")
            except Exception as e:
                logging.error(traceback.format_exc())
                self.log(f"[!] Error en {nombre_archivo}", "error")
                
            self.progreso.set(procesadas / total)
            
        self.log("\n[!!!] PROCESO FINALIZADO.", "success")
