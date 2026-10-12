"""
Módulo de Interfaz Gráfica (UI): CleanDJmix PRO con Tooltips flotantes modernos
y soporte de exportación optimizado para Serato DJ.
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

class CTkToolTip:
    """
    Motor avanzado de tooltips en hover (tarjeta flotante moderna).
    """
    _active_tooltip = None

    def __init__(self, widget, text):
        self.widget = widget
        self.text = text
        self.tipwindow = None
        self.hovered = False
        
        self.widget.bind("<Enter>", self.on_enter, add="+")
        self.widget.bind("<Leave>", self.on_leave, add="+")
        self.widget.bind("<ButtonPress>", self.hide_tip, add="+")

    def on_enter(self, event=None):
        self.hovered = True
        self.widget.after(350, self.check_show)

    def check_show(self):
        if self.hovered and not self.tipwindow:
            try:
                if not self.widget.winfo_exists(): 
                    return
                
                if CTkToolTip._active_tooltip and CTkToolTip._active_tooltip != self:
                    CTkToolTip._active_tooltip.hide_tip()

                x = self.widget.winfo_rootx() + 20
                y = self.widget.winfo_rooty() + self.widget.winfo_height() + 6
                
                self.tipwindow = tw = ctk.CTkToplevel(self.widget)
                tw.wm_overrideredirect(True)
                tw.wm_geometry(f"+{x}+{y}")
                tw.attributes("-topmost", True)
                
                card = ctk.CTkFrame(
                    tw, 
                    fg_color="#1f232a", 
                    corner_radius=8, 
                    border_width=1, 
                    border_color="#00AEEF"
                )
                card.pack(fill="both", expand=True)
                
                label = ctk.CTkLabel(
                    card, 
                    text=self.text, 
                    text_color="#FFFFFF", 
                    font=("Helvetica", 11, "bold"), 
                    justify="left",
                    padx=12, 
                    pady=8
                )
                label.pack()
                CTkToolTip._active_tooltip = self
            except Exception:
                pass

    def on_leave(self, event=None):
        self.hovered = False
        self.hide_tip()

    def hide_tip(self, event=None):
        if CTkToolTip._active_tooltip == self:
            CTkToolTip._active_tooltip = None
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
        
        self.title("CleanDJmix PRO - Suite de Auditoría y Exportación Serato")
        
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
        
        # Opciones de etiquetas personalizadas a inyectar
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

        self.log("CleanDJmix PRO con integración Serato inicializado correctamente.\n", "info")

    def _construir_pestana_control(self):
        header = ctk.CTkFrame(self.tab_control, fg_color="transparent")
        header.pack(fill="x", pady=(0, 10))
        ctk.CTkLabel(header, text="CleanDJmix PRO - Auditoría y Exportación Serato", font=ctk.CTkFont(family="Helvetica", size=24, weight="bold"), text_color="#FFFFFF").pack(side="left")
        ctk.CTkLabel(header, text="SERATO DJ SUITE v4.1", font=ctk.CTkFont(family="Helvetica", size=11, weight="bold"), text_color="#00AEEF").pack(side="right")

        # Layout Principal dividido en dos columnas
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
        CTkToolTip(self.entry_ruta, "Ruta actual seleccionada de la biblioteca musical de origen.")
        
        btn_browse = ctk.CTkButton(src_frame, text="Explorar", command=self.seleccionar_ruta, fg_color="#333333", hover_color="#444444", width=90, height=34)
        btn_browse.pack(side="right", padx=12)
        CTkToolTip(btn_browse, "Haz clic para seleccionar la carpeta raíz con tu música.")

        # Selector de Herramienta de Destino (Serato DJ)
        dest_tool_frame = ctk.CTkFrame(col_left, fg_color="#242424", corner_radius=8)
        dest_tool_frame.pack(fill="x", pady=5, ipady=6)
        
        lbl_tool = ctk.CTkLabel(dest_tool_frame, text="SOFTWARE DJ", font=ctk.CTkFont(size=11, weight="bold"), text_color="#888888")
        lbl_tool.pack(side="left", padx=12)
        
        self.combo_dj_app = ctk.CTkComboBox(dest_tool_frame, values=["Serato DJ Pro / Lite", "(Próximamente más apps)"], width=240, height=30, fg_color="#1e1e1e", button_color="#00AEEF")
        self.combo_dj_app.set("Serato DJ Pro / Lite")
        self.combo_dj_app.pack(side="left", padx=8)
        CTkToolTip(self.combo_dj_app, "Selecciona el software DJ de destino para adaptar la exportación de carpetas.")

        # Panel Derecho: Configuración de Etiquetas Personalizadas
        ctk.CTkLabel(col_right, text="ETIQUETAS A INYECTAR", font=ctk.CTkFont(size=12, weight="bold"), text_color="#00AEEF").pack(anchor="w", pady=(0, 8))
        
        cb1 = ctk.CTkCheckBox(col_right, text="BPM y Clave (Key)", variable=self.chk_vars["bpm"], text_color="#DDD", font=ctk.CTkFont(size=11))
        cb1.pack(anchor="w", pady=2)
        CTkToolTip(cb1, "Inyecta BPM exacto y tonalidad musical compatible con Serato.")

        cb2 = ctk.CTkCheckBox(col_right, text="Energía y Bailabilidad", variable=self.chk_vars["energia"], text_color="#DDD", font=ctk.CTkFont(size=11))
        cb2.pack(anchor="w", pady=2)
        CTkToolTip(cb2, "Añade métricas calculadas de energía de pista.")

        cb3 = ctk.CTkCheckBox(col_right, text="Modo / Escala Musical", variable=self.chk_vars["key"], text_color="#DDD", font=ctk.CTkFont(size=11))
        cb3.pack(anchor="w", pady=2)
        CTkToolTip(cb3, "Añade la escala armónica detectada.")

        cb4 = ctk.CTkCheckBox(col_right, text="Carátula / Cover Art", variable=self.chk_vars["cover"], text_color="#DDD", font=ctk.CTkFont(size=11))
        cb4.pack(anchor="w", pady=2)
        CTkToolTip(cb4, "Inyecta o actualiza la imagen de carátula visible en Serato.")

        cb5 = ctk.CTkCheckBox(col_right, text="Comentario Profesional DJ", variable=self.chk_vars["comentario"], text_color="#DDD", font=ctk.CTkFont(size=11))
        cb5.pack(anchor="w", pady=2)
        CTkToolTip(cb5, "Añade notas de mezcla, estilo e información en los comentarios.")

        cb6 = ctk.CTkCheckBox(col_right, text="Artista, Título y Álbum", variable=self.chk_vars["tags_base"], text_color="#DDD", font=ctk.CTkFont(size=11))
        cb6.pack(anchor="w", pady=2)
        CTkToolTip(cb6, "Normaliza los tags oficiales de ID3 para orden correcto.")

        # Tabla de Auditoría Rápida (Treeview)
        table_frame = ctk.CTkFrame(col_left, fg_color="#1a1a1a", corner_radius=8)
        table_frame.pack(fill="both", expand=True, pady=8, ipady=5)
        
        ctk.CTkLabel(table_frame, text="AUDITORÍA RÁPIDA DE BIBLIOTECA (METADATOS ACTUALES)", font=ctk.CTkFont(size=11, weight="bold"), text_color="#00AEEF").pack(anchor="w", padx=12, pady=5)

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
        CTkToolTip(safe_cb, "Simula todo el proceso en consola sin alterar archivos reales en el disco.")

        self.progreso = ctk.CTkProgressBar(col_left, progress_color="#00AEEF", fg_color="#242424", height=8)
        self.progreso.pack(fill="x", pady=8)
        self.progreso.set(0)

        # Botones de Acción Operativa con Tooltips
        btn_frame = ctk.CTkFrame(col_left, fg_color="transparent")
        btn_frame.pack(fill="x", pady=5)
        
        btn_audit = ctk.CTkButton(btn_frame, text="1. Auditar Biblioteca", command=lambda: self.iniciar_hilo("auditar"), fg_color="#333333", text_color="#00AEEF", font=ctk.CTkFont(weight="bold"), height=42)
        btn_audit.pack(side="left", expand=True, fill="x", padx=(0, 5))
        CTkToolTip(btn_audit, "Escanea la carpeta origen y muestra la tabla con los metadatos y estado actual.")

        btn_std = ctk.CTkButton(btn_frame, text="2. Inyectar Tags y Clasificar", command=lambda: self.iniciar_hilo("normal"), fg_color="#00AEEF", text_color="#000000", font=ctk.CTkFont(weight="bold"), height=42)
        btn_std.pack(side="left", expand=True, fill="x", padx=5)
        CTkToolTip(btn_std, "Aplica las etiquetas personalizadas seleccionadas y organiza la música para Serato.")

        btn_resc = ctk.CTkButton(btn_frame, text="3. Rescate Shazam", command=lambda: self.iniciar_hilo("rescate"), fg_color="#242424", text_color="#00AEEF", hover_color="#333333", font=ctk.CTkFont(weight="bold"), height=42)
        btn_resc.pack(side="left", expand=True, fill="x", padx=(5, 0))
        CTkToolTip(btn_resc, "Identifica pistas huérfanas utilizando el reconocimiento online de Shazam.")

    def _construir_pestana_destinos(self):
        ctk.CTkLabel(self.tab_destinos, text="Configuración Avanzada de Destinos (Estructura Serato)", font=ctk.CTkFont(size=16, weight="bold"), text_color="#FFFFFF").pack(pady=10)
        ctk.CTkLabel(self.tab_destinos, text="Personaliza las carpetas y rutas de disco compatibles con las crate playlists de Serato.", font=ctk.CTkFont(size=11), text_color="#888888").pack(pady=(0, 10))

        scroll = ctk.CTkScrollableFrame(self.tab_destinos, fg_color="#1e1e1e")
        scroll.pack(fill="both", expand=True, padx=5, pady=5)

        self.widgets_destinos = {}

        for genero, data in self.destinos_personalizados.items():
            g_frame = ctk.CTkFrame(scroll, fg_color="#242424", corner_radius=6)
            g_frame.pack(fill="x", pady=6, padx=5, ipady=6)
            
            lbl_GM = ctk.CTkLabel(g_frame, text=f"Género Madre (Serato Crate): {genero}", font=ctk.CTkFont(size=13, weight="bold"), text_color="#00AEEF")
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
                CTkToolTip(e_carp, "Nombre de la sub-carpeta que leerá Serato.")
                
                e_ruta = ctk.CTkEntry(s_frame, height=32, fg_color="#242424", text_color="#FFFFFF", placeholder_text="Ruta opcional (por defecto origen)")
                e_ruta.pack(side="left", padx=8, expand=True, fill="x")
                CTkToolTip(e_ruta, "Ruta absoluta de destino (ej: disco externo para Serato).")
                
                def elegir_path(entry=e_ruta):
                    d = filedialog.askdirectory()
                    if d:
                        entry.delete(0, "end")
                        entry.insert(0, d)
                
                btn_d = ctk.CTkButton(s_frame, text="Dir", command=elegir_path, width=45, height=32, fg_color="#333333")
                btn_d.pack(side="right", padx=10)
                CTkToolTip(btn_d, "Selecciona una unidad externa para Serato.")
                
                self.widgets_destinos[genero][sub] = {"carpeta": e_carp, "ruta": e_ruta}

    def _construir_pestana_logs(self):
        lbl_consola_title = ctk.CTkLabel(self.tab_logs, text="Registro de Ejecución en Tiempo Real (Serato Bridge)", font=ctk.CTkFont(size=14, weight="bold"), text_color="#FFFFFF")
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

        for item in self.tree.get_children():
            self.tree.delete(item)
            
        self.log(f"[ MÓDULO {modo.upper()} ] Analizando {total} pistas para Serato...", "info")
        
        resultados_informe = []
        conteo_generos = {}
        procesadas = 0
        
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
                    self.log(f"[{procesadas}/{total}] Serato Export OK (Tags inyectados) -> {nuevo_nombre}", "success")
                else:
                    self.log(f"[{procesadas}/{total}] Auditoría / Simulacro Serato: {nuevo_nombre}", "info")
            except Exception as e:
                logging.error(traceback.format_exc())
                self.log(f"[!] Error en {nombre_archivo}", "error")
                
            self.progreso.set(procesadas / total)

        if modo != "auditar" and resultados_informe:
            csv_path = AudioAdapter.exportar_informe_csv(resultados_informe, ruta_base)
            if csv_path:
                self.log(f"\n[i] INFORME ANALÍTICO CSV PARA SERATO GENERADO: {csv_path}", "success")
            
            self.log("\n--- ESTADÍSTICAS DE EXPORTACIÓN (SERATO) ---", "info")
            for gen, cantid in conteo_generos.items():
                self.log(f"  • {gen}: {cantid} pistas preparadas", "success")
                
        self.log("\n[!!!] PROCESO FINALIZADO.", "success")
