"""
Módulo de Interfaz Gráfica (UI): Diseñado con CustomTkinter con enfoque 
Liquid Design (adaptable y redimensionable) y apertura maximizada por defecto.
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

class CleanDJmixApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        self.title("CleanDJmix PRO - Arquitectura Hexagonal & Taxonomía Avanzada")
        
        # Apertura maximizada por defecto (Pantalla completa / Maximized)
        try:
            self.state("-zoomed") # Compatible con macOS y Linux
        except Exception:
            try:
                self.attributes("-zoomed", True)
            except Exception:
                self.geometry("1400x900") # Fallback de alta resolución

        self.resizable(True, True)
        
        self.safe_mode_var = ctk.BooleanVar(value=True)
        self.cancel_flag = False 
        
        self.destinos_personalizados = {}
        for genero, subgeneros in TAXONOMIA_ELECTRONICA.items():
            self.destinos_personalizados[genero] = {
                "carpeta": genero,
                "ruta": "",
                "subgeneros": {sub: {"carpeta": sub, "ruta": ""} for sub in subgeneros}
            }

        # Contenedor Principal con Pestañas (Liquid Design)
        self.tabview = ctk.CTkTabview(self, fg_color="#181818", segmented_button_selected_color="#00AEEF", segmented_button_unselected_color="#242424")
        self.tabview.pack(fill="both", expand=True, padx=25, pady=(25, 10))
        
        self.tab_control = self.tabview.add("Control y Analisis")
        self.tab_destinos = self.tabview.add("Destinos y Taxonomia")
        self.tab_logs = self.tabview.add("Consola y Logs")
        
        self._construir_pestana_control()
        self._construir_pestana_destinos()
        self._construir_pestana_logs()
        
        # Barra de Estado Inferior Adaptable
        status_frame = ctk.CTkFrame(self, fg_color="#141414", corner_radius=6, height=38)
        status_frame.pack(fill="x", padx=25, pady=(0, 20))
        status_frame.pack_propagate(False)
        
        ctk.CTkLabel(status_frame, text="AYUDA / INFO:", font=ctk.CTkFont(size=10, weight="bold"), text_color="#00AEEF").pack(side="left", padx=(15, 5))
        self.lbl_status = ctk.CTkLabel(status_frame, text="Pasa el ratón por cualquier control para ver su descripción detallada.", font=ctk.CTkFont(size=11), text_color="#AAAAAA")
        self.lbl_status.pack(side="left", padx=5)

        self.log("CleanDJmix PRO Liquid UI inicializado correctamente en modo maximizado.\n", "info")

    def vincular_ayuda(self, widget, texto_ayuda):
        widget.bind("<Enter>", lambda e: self.lbl_status.configure(text=texto_ayuda, text_color="#FFFFFF"), add="+")
        widget.bind("<Leave>", lambda e: self.lbl_status.configure(text="Pasa el ratón por cualquier control para ver su descripción detallada.", text_color="#AAAAAA"), add="+")

    def _construir_pestana_control(self):
        header = ctk.CTkFrame(self.tab_control, fg_color="transparent")
        header.pack(fill="x", pady=(0, 15))
        ctk.CTkLabel(header, text="CleanDJmix PRO", font=ctk.CTkFont(family="Helvetica", size=26, weight="bold"), text_color="#FFFFFF").pack(side="left")
        ctk.CTkLabel(header, text="MODERN DJ SUITE v3.2 (LIQUID)", font=ctk.CTkFont(family="Helvetica", size=11, weight="bold"), text_color="#00AEEF").pack(side="right")

        # Selector de Carpeta Origen (Liquid)
        src_frame = ctk.CTkFrame(self.tab_control, fg_color="#242424", corner_radius=8)
        src_frame.pack(fill="x", pady=10, ipady=8)
        lbl_origen = ctk.CTkLabel(src_frame, text="CARPETA ORIGEN", font=ctk.CTkFont(size=11, weight="bold"), text_color="#888888")
        lbl_origen.pack(side="left", padx=15)
        self.vincular_ayuda(lbl_origen, "Directorio raíz en tu disco que contiene las pistas de música a clasificar.")
        
        self.entry_ruta = ctk.CTkEntry(src_frame, height=38, fg_color="#1e1e1e", text_color="#FFFFFF", font=("Courier", 12))
        self.entry_ruta.insert(0, "/Users/admin/Music/mi musica/")
        self.entry_ruta.pack(side="left", padx=10, expand=True, fill="x")
        self.vincular_ayuda(self.entry_ruta, "Ruta actual seleccionada para la biblioteca de origen.")
        
        btn_browse = ctk.CTkButton(src_frame, text="Explorar", command=self.seleccionar_ruta, fg_color="#333333", hover_color="#444444", width=110, height=38)
        btn_browse.pack(side="right", padx=15)
        self.vincular_ayuda(btn_browse, "Haz clic para abrir el explorador de archivos y seleccionar la carpeta de música.")

        # Pantalla LCD / Visualizador de Estado (Liquid)
        lcd = ctk.CTkFrame(self.tab_control, fg_color="#111111", corner_radius=10)
        lcd.pack(fill="x", pady=15, ipady=15)
        self.vincular_ayuda(lcd, "Panel LCD en tiempo real con el estado de la pista actual, metadatos y análisis.")
        
        self.lbl_file = ctk.CTkLabel(lcd, text="ARCHIVO: ESPERANDO PISTA...", font=("Menlo", 12), text_color="#666666")
        self.lbl_file.pack(pady=(10, 2))
        self.lbl_id3 = ctk.CTkLabel(lcd, text="ETIQUETA ID3: EN ESPERA", font=("Menlo", 16, "bold"), text_color="#FFFFFF")
        self.lbl_id3.pack(pady=2)
        ctk.CTkLabel(lcd, text="----------------------------------------------------------------------------------------------------", font=("Arial", 12), text_color="#333333").pack(pady=2)
        self.lbl_stats = ctk.CTkLabel(lcd, text="BPM: 000.00  |  GENERO: PENDIENTE  |  SUBGENERO: PENDIENTE", font=("Courier", 14, "bold"), text_color="#00AEEF")
        self.lbl_stats.pack(pady=(2, 10))

        safe_cb = ctk.CTkCheckBox(self.tab_control, text="Modo Seguro (Simulación: No modifica ficheros físicos en disco)", variable=self.safe_mode_var, text_color="#AAAAAA", fg_color="#00AEEF")
        safe_cb.pack(pady=(0, 15), anchor="w")
        self.vincular_ayuda(safe_cb, "Activa el modo simulación: analiza y muestra resultados sin mover ni alterar tus archivos originales.")

        self.progreso = ctk.CTkProgressBar(self.tab_control, progress_color="#00AEEF", fg_color="#242424", height=10)
        self.progreso.pack(fill="x", pady=(0, 20))
        self.progreso.set(0)

        # Botones de Acción Operativa (Liquid Grid)
        btn_frame = ctk.CTkFrame(self.tab_control, fg_color="transparent")
        btn_frame.pack(fill="x", pady=5)
        
        btn_std = ctk.CTkButton(btn_frame, text="Analisis Estandar", command=lambda: self.iniciar_hilo("normal"), fg_color="#00AEEF", text_color="#000000", font=ctk.CTkFont(weight="bold"), height=48)
        btn_std.pack(side="left", expand=True, fill="x", padx=(0, 8))
        self.vincular_ayuda(btn_std, "Procesa etiquetas ID3, consulta Discogs, clasifica por Ishkur y genera informe CSV.")

        btn_resc = ctk.CTkButton(btn_frame, text="Rescate Shazam", command=lambda: self.iniciar_hilo("rescate"), fg_color="#242424", text_color="#00AEEF", hover_color="#333333", font=ctk.CTkFont(weight="bold"), height=48)
        btn_resc.pack(side="left", expand=True, fill="x", padx=8)
        self.vincular_ayuda(btn_resc, "Identifica automáticamente pistas huérfanas utilizando el motor de Shazam.")

        btn_acu = ctk.CTkButton(btn_frame, text="Analisis Acustico", command=lambda: self.iniciar_hilo("acustico"), fg_color="#242424", text_color="#FFAA00", hover_color="#333333", font=ctk.CTkFont(weight="bold"), height=48)
        btn_acu.pack(side="left", expand=True, fill="x", padx=(8, 0))
        self.vincular_ayuda(btn_acu, "Extrae métricas puras de audio (BPM, energía, centroide espectral y groove) con Librosa.")

    def _construir_pestana_destinos(self):
        ctk.CTkLabel(self.tab_destinos, text="Configuracion Avanzada de Destinos y Taxonomia (Liquid)", font=ctk.CTkFont(size=16, weight="bold"), text_color="#FFFFFF").pack(pady=10)
        ctk.CTkLabel(self.tab_destinos, text="Personaliza el nombre de las carpetas de salida y las rutas de disco para cada género y subgénero de forma fluida.", font=ctk.CTkFont(size=11), text_color="#888888").pack(pady=(0, 10))

        # Scrollable Frame Adaptable que llena todo el espacio disponible
        scroll = ctk.CTkScrollableFrame(self.tab_destinos, fg_color="#1e1e1e")
        scroll.pack(fill="both", expand=True, padx=5, pady=5)

        self.widgets_destinos = {}

        for genero, data in self.destinos_personalizados.items():
            g_frame = ctk.CTkFrame(scroll, fg_color="#242424", corner_radius=6)
            g_frame.pack(fill="x", pady=6, padx=5, ipady=6)
            
            lbl_GM = ctk.CTkLabel(g_frame, text=f"Genero Madre: {genero}", font=ctk.CTkFont(size=13, weight="bold"), text_color="#00AEEF")
            lbl_GM.pack(anchor="w", padx=15, pady=5)
            self.vincular_ayuda(lbl_GM, f"Categoría principal de música electrónica: {genero}.")
            
            sub_container = ctk.CTkFrame(g_frame, fg_color="transparent")
            sub_container.pack(fill="x", padx=15, pady=2)
            
            self.widgets_destinos[genero] = {}
            for sub in TAXONOMIA_ELECTRONICA[genero]:
                s_frame = ctk.CTkFrame(sub_container, fg_color="#181818", corner_radius=4)
                s_frame.pack(fill="x", pady=3, ipady=4)
                
                lbl_sub = ctk.CTkLabel(s_frame, text=sub, font=ctk.CTkFont(size=11), text_color="#CCCCCC", width=180, anchor="w")
                lbl_sub.pack(side="left", padx=10)
                self.vincular_ayuda(lbl_sub, f"Subgénero específico: {sub} (perteneciente a {genero}).")
                
                e_carp = ctk.CTkEntry(s_frame, width=180, height=32, fg_color="#242424", text_color="#FFFFFF")
                e_carp.insert(0, sub)
                e_carp.pack(side="left", padx=8)
                self.vincular_ayuda(e_carp, "Nombre de la carpeta física que se creará para clasificar este subgénero.")
                
                e_ruta = ctk.CTkEntry(s_frame, height=32, fg_color="#242424", text_color="#FFFFFF", placeholder_text="Ruta opcional (por defecto origen)")
                e_ruta.pack(side="left", padx=8, expand=True, fill="x")
                self.vincular_ayuda(e_ruta, "Ruta absoluta opcional de destino (ej: pendrive USB, disco externo).")
                
                def elegir_path(entry=e_ruta):
                    d = filedialog.askdirectory()
                    if d:
                        entry.delete(0, "end")
                        entry.insert(0, d)
                
                btn_d = ctk.CTkButton(s_frame, text="Dir", command=elegir_path, width=45, height=32, fg_color="#333333")
                btn_d.pack(side="right", padx=10)
                self.vincular_ayuda(btn_d, "Explora y selecciona una unidad de disco o carpeta externa de exportación.")
                
                self.widgets_destinos[genero][sub] = {"carpeta": e_carp, "ruta": e_ruta}

    def _construir_pestana_logs(self):
        lbl_consola_title = ctk.CTkLabel(self.tab_logs, text="Registro de Ejecucion en Tiempo Real (Liquid View)", font=ctk.CTkFont(size=14, weight="bold"), text_color="#FFFFFF")
        lbl_consola_title.pack(pady=10, anchor="w", padx=5)
        self.vincular_ayuda(lbl_consola_title, "Monitor de eventos, progreso y resultados de clasificación en vivo.")
        
        self.consola = ctk.CTkTextbox(self.tab_logs, fg_color="#111111", text_color="#00AEEF", font=("Menlo", 12), corner_radius=8)
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
        
        resultados_informe = []
        conteo_generos = {}
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
                
                conteo_generos[genero] = conteo_generos.get(genero, 0) + 1
                resultados_informe.append({
                    "artista": art_oficial,
                    "titulo": tit_oficial,
                    "bpm": bpm,
                    "anio": año,
                    "genero": genero,
                    "subgenero": subgenero,
                    "ruta_final": ruta_destino
                })
                
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
            
        if resultados_informe:
            csv_path = AudioAdapter.exportar_informe_csv(resultados_informe, ruta_base)
            if csv_path:
                self.log(f"\n[i] INFORME ANALITICO CSV GENERADO: {csv_path}", "success")
            
            self.log("\n--- ESTADÍSTICAS DE LA SESIÓN ---", "info")
            for gen, cantid in conteo_generos.items():
                self.log(f"  • {gen}: {cantid} pistas clasificadas", "success")
                
        self.log("\n[!!!] PROCESO FINALIZADO.", "success")
