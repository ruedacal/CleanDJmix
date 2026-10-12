"""
Módulo de Infraestructura / UI: CleanDJmix PRO con Tabla de Auditoría de Biblioteca
y Editor Avanzado de Etiquetas Personalizadas para DJs (BPM, Key, Energía, Comentarios, etc.).
"""

import os
import shutil
import threading
import traceback
import logging
import customtkinter as ctk
from tkinter import filedialog, ttk
from domain.models import TrackDomain, TAXONOMIA_ELECTRONICA
from infrastructure.adapters import AudioAdapter

# Configuración global de CustomTkinter
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

logging.basicConfig(filename='CleanDJmix_crash.log', level=logging.ERROR, format='%(asctime)s - [CleanDJmix Error] - %(message)s')

class CleanDJmixApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        self.title("CleanDJmix PRO - Auditoría y Etiquetado Profesional para DJs")
        
        try:
            self.state("-zoomed")
        except Exception:
            try:
                self.attributes("-zoomed", True)
            except Exception:
                self.geometry("1400x900")

        self.resizable(True, True)
        
        self.safe_mode_var = ctk.BooleanVar(value=True)
        self.cancel_flag = False 
        
        # Variables de selección de etiquetas personalizadas a inyectar
        self.chk_vars = {
            "bpm": ctk.BooleanVar(value=True),
            "key": ctk.BooleanVar(value=True),
            "energia": ctk.BooleanVar(value=True),
            "danceability": ctk.BooleanVar(value=True),
            "cover": ctk.BooleanVar(value=False),
            "comentario": ctk.BooleanVar(value=True),
            "tags_base": ctk.BooleanVar(value=True)
        }
        
        self.destinos_personalizados = {}
        for genero, subgeneros in TAXONOMIA_ELECTRONICA.items():
            self.destinos_personalizados[genero] = {
                "carpeta": genero,
                "ruta": "",
                "subgeneros": {sub: {"carpeta": sub, "ruta": ""} for sub in subgeneros}
            }

        # Contenedor Principal con Pestañas
        self.tabview = ctk.CTkTabview(self, fg_color="#181818", segmented_button_selected_color="#00AEEF", segmented_button_unselected_color="#242424")
        self.tabview.pack(fill="both", expand=True, padx=25, pady=(25, 10))
        
        self.tab_control = self.tabview.add("Control y Auditoria")
        self.tab_destinos = self.tabview.add("Destinos y Taxonomia")
        self.tab_logs = self.tabview.add("Consola y Logs")
        
        self._construir_pestana_control()
        self._construir_pestana_destinos()
        self._construir_pestana_logs()
        
        # Barra de Estado Inferior
        status_frame = ctk.CTkFrame(self, fg_color="#141414", corner_radius=6, height=38)
        status_frame.pack(fill="x", padx=25, pady=(0, 20))
        status_frame.pack_propagate(False)
        
        ctk.CTkLabel(status_frame, text="AYUDA / INFO:", font=ctk.CTkFont(size=10, weight="bold"), text_color="#00AEEF").pack(side="left", padx=(15, 5))
        self.lbl_status = ctk.CTkLabel(status_frame, text="Pasa el ratón por cualquier control para ver su descripción detallada.", font=ctk.CTkFont(size=11), text_color="#AAAAAA")
        self.lbl_status.pack(side="left", padx=5)

        self.log("CleanDJmix PRO Suite de Auditoría y Metadatos inicializado correctamente.\n", "info")

    def vincular_ayuda(self, widget, texto_ayuda):
        widget.bind("<Enter>", lambda e: self.lbl_status.configure(text=texto_ayuda, text_color="#FFFFFF"), add="+")
        widget.bind("<Leave>", lambda e: self.lbl_status.configure(text="Pasa el ratón por cualquier control para ver su descripción detallada.", text_color="#AAAAAA"), add="+")

    def _construir_pestana_control(self):
        header = ctk.CTkFrame(self.tab_control, fg_color="transparent")
        header.pack(fill="x", pady=(0, 10))
        ctk.CTkLabel(header, text="CleanDJmix PRO - Auditoría y Metadatos", font=ctk.CTkFont(family="Helvetica", size=24, weight="bold"), text_color="#FFFFFF").pack(side="left")
        ctk.CTkLabel(header, text="DJ METADATA SUITE v4.0", font=ctk.CTkFont(family="Helvetica", size=11, weight="bold"), text_color="#00AEEF").pack(side="right")

        # Layout Principal dividido en dos columnas (Izquierda: Origen y Acciones | Derecha: Selector de Etiquetas Personalizadas)
        main_pane = ctk.CTkFrame(self.tab_control, fg_color="transparent")
        main_pane.pack(fill="x", pady=5)
        
        col_left = ctk.CTkFrame(main_pane, fg_color="transparent")
        col_left.pack(side="left", fill="both", expand=True, padx=(0, 10))
        
        col_right = ctk.CTkFrame(main_pane, fg_color="#242424", corner_radius=8)
        col_right.pack(side="right", fill="y", padx=(10, 0), ipadx=10, ipady=10)

        # Selector de Carpeta Origen
        src_frame = ctk.CTkFrame(col_left, fg_color="#242424", corner_radius=8)
        src_frame.pack(fill="x", pady=5, ipady=6)
        lbl_origen = ctk.CTkLabel(src_frame, text="ORIGEN", font=ctk.CTkFont(size=11, weight="bold"), text_color="#888888")
        lbl_origen.pack(side="left", padx=12)
        
        self.entry_ruta = ctk.CTkEntry(src_frame, height=34, fg_color="#1e1e1e", text_color="#FFFFFF", font=("Courier", 11))
        self.entry_ruta.insert(0, "/Users/admin/Music/mi musica/")
        self.entry_ruta.pack(side="left", padx=8, expand=True, fill="x")
        
        btn_browse = ctk.CTkButton(src_frame, text="Explorar", command=self.seleccionar_ruta, fg_color="#333333", hover_color="#444444", width=90, height=34)
        btn_browse.pack(side="right", padx=12)

        # Panel Derecho: Configuración de Etiquetas Personalizadas a Inyectar
        ctk.CTkLabel(col_right, text="ETIQUETAS A INYECTAR", font=ctk.CTkFont(size=12, weight="bold"), text_color="#00AEEF").pack(anchor="w", pady=(0, 8))
        
        ctk.CTkCheckBox(col_right, text="BPM y Clave (Key)", variable=self.chk_vars["bpm"], text_color="#DDD", font=ctk.CTkFont(size=11)).pack(anchor="w", pady=2)
        ctk.CTkCheckBox(col_right, text="Energía y Bailabilidad", variable=self.chk_vars["energia"], text_color="#DDD", font=ctk.CTkFont(size=11)).pack(anchor="w", pady=2)
        ctk.CTkCheckBox(col_right, text="Modo / Escala Musical", variable=self.chk_vars["key"], text_color="#DDD", font=ctk.CTkFont(size=11)).pack(anchor="w", pady=2)
        ctk.CTkCheckBox(col_right, text="Carátula / Cover Art", variable=self.chk_vars["cover"], text_color="#DDD", font=ctk.CTkFont(size=11)).pack(anchor="w", pady=2)
        ctk.CTkCheckBox(col_right, text="Comentario Profesional DJ", variable=self.chk_vars["comentario"], text_color="#DDD", font=ctk.CTkFont(size=11)).pack(anchor="w", pady=2)
        ctk.CTkCheckBox(col_right, text="Artista, Título y Álbum", variable=self.chk_vars["tags_base"], text_color="#DDD", font=ctk.CTkFont(size=11)).pack(anchor="w", pady=2)

        # Tabla de Auditoría Rápida (Treeview)
        table_frame = ctk.CTkFrame(col_left, fg_color="#1a1a1a", corner_radius=8)
        table_frame.pack(fill="both", expand=True, pady=8, ipady=5)
        
        ctk.CTkLabel(table_frame, text="AUDITORÍA RÁPIDA DE BIBLIOTECA (METADATOS ACTUALES)", font=ctk.CTkFont(size=11, weight="bold"), text_color="#00AEEF").pack(anchor="w", padx=12, pady=5)

        # Configuración de la Tabla nativa estilizada en modo oscuro
        style = ttk.Style()
        style.theme_use("default")
        style.configure("Treeview", background="#111111", foreground="#FFFFFF", fieldbackground="#111111", rowheight=24, font=("Menlo", 10))
        style.configure("Treeview.Heading", background="#242424", foreground="#00AEEF", font=("Helvetica", 10, "bold"))
        style.map("Treeview", background=[('selected', '#00AEEF')])

        columns = ("archivo", "artista", "titulo", "bpm", "estado")
        self.tree = ttk.Treeview(table_frame, columns=columns, show="headings", height=8)
        
        self.tree.heading("archivo", text="Fichero")
        self.tree.heading("artista", text="Artista ID3")
        self.tree.heading("titulo", text="Título ID3")
        self.tree.heading("bpm", text="BPM Est.")
        self.tree.heading("estado", text="Estado Taxonomía")
        
        self.tree.column("archivo", width=220, anchor="w")
        self.tree.column("artista", width=150, anchor="w")
        self.tree.column("titulo", width=180, anchor="w")
        self.tree.column("bpm", width=80, anchor="center")
        self.tree.column("estado", width=160, anchor="center")
        
        scrollbar = ttk.Scrollbar(table_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        self.tree.pack(side="left", fill="both", expand=True, padx=10, pady=5)
        scrollbar.pack(side="right", fill="y", pady=5)

        # Checkbox de Modo Seguro y Progreso
        safe_cb = ctk.CTkCheckBox(col_left, text="Modo Seguro (Simulación: No modifica ficheros físicos en disco)", variable=self.safe_mode_var, text_color="#AAAAAA", fg_color="#00AEEF")
        safe_cb.pack(pady=5, anchor="w")

        self.progreso = ctk.CTkProgressBar(col_left, progress_color="#00AEEF", fg_color="#242424", height=8)
        self.progreso.pack(fill="x", pady=8)
        self.progreso.set(0)

        # Botones de Acción Operativa
        btn_frame = ctk.CTkFrame(col_left, fg_color="transparent")
        btn_frame.pack(fill="x", pady=5)
        
        btn_audit = ctk.CTkButton(btn_frame, text="1. Auditar Biblioteca", command=lambda: self.iniciar_hilo("auditar"), fg_color="#333333", text_color="#00AEEF", font=ctk.CTkFont(weight="bold"), height=42)
        btn_audit.pack(side="left", expand=True, fill="x", padx=(0, 5))
        self.vincular_ayuda(btn_audit, "Escanea la carpeta origen y muestra en la tabla los metadatos y estado actual.")

        btn_std = ctk.CTkButton(btn_frame, text="2. Inyectar Tags y Clasificar", command=lambda: self.iniciar_hilo("normal"), fg_color="#00AEEF", text_color="#000000", font=ctk.CTkFont(weight="bold"), height=42)
        btn_std.pack(side="left", expand=True, fill="x", padx=5)
        self.vincular_ayuda(btn_std, "Aplica las etiquetas personalizadas seleccionadas, enriquece metadatos y organiza en carpetas.")

        btn_resc = ctk.CTkButton(btn_frame, text="3. Rescate Shazam", command=lambda: self.iniciar_hilo("rescate"), fg_color="#242424", text_color="#00AEEF", hover_color="#333333", font=ctk.CTkFont(weight="bold"), height=42)
        btn_resc.pack(side="left", expand=True, fill="x", padx=(5, 0))
        self.vincular_ayuda(btn_resc, "Identifica pistas huérfanas o sin metadatos utilizando el reconocimiento online de Shazam.")

    def _construir_pestana_destinos(self):
        ctk.CTkLabel(self.tab_destinos, text="Configuracion Avanzada de Destinos y Taxonomia", font=ctk.CTkFont(size=16, weight="bold"), text_color="#FFFFFF").pack(pady=10)
        ctk.CTkLabel(self.tab_destinos, text="Personaliza el nombre de las carpetas de salida y las rutas de disco para cada género y subgénero.", font=ctk.CTkFont(size=11), text_color="#888888").pack(pady=(0, 10))

        scroll = ctk.CTkScrollableFrame(self.tab_destinos, fg_color="#1e1e1e")
        scroll.pack(fill="both", expand=True, padx=5, pady=5)

        self.widgets_destinos = {}

        for genero, data in self.destinos_personalizados.items():
            g_frame = ctk.CTkFrame(scroll, fg_color="#242424", corner_radius=6)
            g_frame.pack(fill="x", pady=6, padx=5, ipady=6)
            
            lbl_GM = ctk.CTkLabel(g_frame, text=f"Genero Madre: {genero}", font=ctk.CTkFont(size=13, weight="bold"), text_color="#00AEEF")
            lbl_GM.pack(anchor="w", padx=15, pady=5)
            
            sub_container = ctk.CTkFrame(g_frame, fg_color="transparent")
            sub_container.pack(fill="x", padx=15, pady=2)
            
            self.widgets_destinos[genero] = {}
            for sub in TAXONOMIA_ELECTRONICA[genero]:
                s_frame = ctk.CTkFrame(sub_container, fg_color="#181818", corner_radius=4)
                s_frame.pack(fill="x", pady=3, ipady=4)
                
                lbl_sub = ctk.CTkLabel(s_frame, text=sub, font=ctk.CTkFont(size=11), text_color="#CCCCCC", width=180, anchor="w")
                lbl_sub.pack(side="left", padx=10)
                
                e_carp = ctk.CTkEntry(s_frame, width=180, height=32, fg_color="#242424", text_color="#FFFFFF")
                e_carp.insert(0, sub)
                e_carp.pack(side="left", padx=8)
                
                e_ruta = ctk.CTkEntry(s_frame, height=32, fg_color="#242424", text_color="#FFFFFF", placeholder_text="Ruta opcional (por defecto origen)")
                e_ruta.pack(side="left", padx=8, expand=True, fill="x")
                
                def elegir_path(entry=e_ruta):
                    d = filedialog.askdirectory()
                    if d:
                        entry.delete(0, "end")
                        entry.insert(0, d)
                
                btn_d = ctk.CTkButton(s_frame, text="Dir", command=elegir_path, width=45, height=32, fg_color="#333333")
                btn_d.pack(side="right", padx=10)
                
                self.widgets_destinos[genero][sub] = {"carpeta": e_carp, "ruta": e_ruta}

    def _construir_pestana_logs(self):
        lbl_consola_title = ctk.CTkLabel(self.tab_logs, text="Registro de Ejecucion en Tiempo Real", font=ctk.CTkFont(size=14, weight="bold"), text_color="#FFFFFF")
        lbl_consola_title.pack(pady=10, anchor="w", padx=5)
        
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
        
        for root_dir, dirs, files in os.walk(ruta_base):
            for file in files:
                if not file.lower().endswith('.mp3'): continue
                archivos_mp3.append(os.path.join(root_dir, file))
                    
        total = len(archivos_mp3)
        if total == 0:
            self.log("[!] No se encontraron archivos MP3.", "error")
            return

        # Limpiar tabla previa
        for item in self.tree.get_children():
            self.tree.delete(item)
            
        self.log(f"[ MÓDULO {modo.upper()} ] Analizando {total} pistas...", "info")
        
        resultados_informe = []
        conteo_generos = {}
        procesadas = 0
        
        # Obtener preferencias de etiquetas personalizadas activas
        opts = {k: v.get() for k, v in self.chk_vars.items()}
        is_safe_mode = self.safe_mode_var.get()

        for ruta_completa in archivos_mp3:
            if self.cancel_flag: break
            procesadas += 1
            nombre_archivo = os.path.basename(ruta_completa)
            
            try:
                artista, titulo = AudioAdapter.obtener_metadatos_id3(ruta_completa, nombre_archivo)
                bpm, energia, groove, presencia_vocal, zcr, centroide = AudioAdapter.analizar_acustica(ruta_completa)
                año, estilos, art_oficial, tit_oficial = AudioAdapter.buscar_discogs(artista, titulo)
                
                genero, subgenero = TrackDomain.cerebro_ishkur(bpm, año, estilos, presencia_vocal, zcr, centroide)
                
                # Insertar en la tabla de auditoría visual
                self.tree.insert("", "end", values=(nombre_archivo, art_oficial, tit_oficial, f"{bpm:.1f}", f"{genero} -> {subgenero}"))

                if modo == "auditar":
                    continue

                if modo == "rescate" and (artista == "VRC_MISSING" or titulo == "VRC_MISSING"):
                    art_oficial, tit_oficial = AudioAdapter.rescate_shazam(ruta_completa)

                nuevo_nombre = AudioAdapter.actualizar_fichero(ruta_completa, art_oficial, tit_oficial, año, bpm, is_safe_mode)
                
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
                    self.log(f"[{procesadas}/{total}] Procesado con tags {list(k for k,v in opts.items() if v)} -> {nuevo_nombre}", "success")
                else:
                    self.log(f"[{procesadas}/{total}] Auditoría / Simulacro: {nuevo_nombre}", "info")
            except Exception as e:
                logging.error(traceback.format_exc())
                self.log(f"[!] Error en {nombre_archivo}", "error")
                
            self.progreso.set(procesadas / total)

        if modo != "auditar" and resultados_informe:
            csv_path = AudioAdapter.exportar_informe_csv(resultados_informe, ruta_base)
            if csv_path:
                self.log(f"\n[i] INFORME ANALÍTICO CSV GENERADO: {csv_path}", "success")
            
            self.log("\n--- ESTADÍSTICAS DE LA SESIÓN ---", "info")
            for gen, cantid in conteo_generos.items():
                self.log(f"  • {gen}: {cantid} pistas procesadas", "success")
                
        self.log("\n[!!!] PROCESO FINALIZADO.", "success")
