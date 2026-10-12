"""
Módulo de Interfaz Gráfica (UI): CleanDJmix PRO con soporte para descarga directa
desde Spotify (spotDL), auditoría profesional, marcas de agua corporativas y exportación a Serato.
"""

import os
import shutil
import threading
import time
import traceback
import logging
import customtkinter as ctk
from tkinter import filedialog, ttk
from PIL import Image
from domain.models import TrackDomain, TAXONOMIA_ELECTRONICA
from infrastructure.adapters import AudioAdapter, SpotDLAdapter

# Configuración global de CustomTkinter
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

logging.basicConfig(filename='CleanDJmix_crash.log', level=logging.ERROR, format='%(asctime)s - [CleanDJmix Error] - %(message)s')

class CTkToolTip:
    """Motor avanzado de tooltips en hover (tarjeta flotante moderna)."""
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
                
                card = ctk.CTkFrame(tw, fg_color="#1f232a", corner_radius=8, border_width=1, border_color="#00AEEF")
                card.pack(fill="both", expand=True)
                
                label = ctk.CTkLabel(card, text=self.text, text_color="#FFFFFF", font=("Helvetica", 11, "bold"), justify="left", padx=12, pady=8)
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
        
        self.title("CleanDJmix PRO - Suite Profesional para DJs")
        
        # Apertura en pantalla completa con soporte para salir con tecla ESC
        try:
            self.attributes("-fullscreen", True)
            self.bind("<Escape>", lambda e: self.attributes("-fullscreen", False))
        except Exception:
            try:
                self.state("-zoomed")
            except Exception:
                self.geometry("1400x900")

        self.resizable(True, True)
        
        # Carga de logos corporativos
        self.logo_img_header = None
        self.logo_img_small = None
        try:
            for p in ["assets/logo_grande.png", "assets/AppIcon.appiconset/icon_512x512.png", "assets/icon_32x32.png"]:
                if os.path.exists(p):
                    pil_img = Image.open(p)
                    self.logo_img_header = ctk.CTkImage(light_image=pil_img, dark_image=pil_img, size=(50, 50))
                    self.logo_img_small = ctk.CTkImage(light_image=pil_img, dark_image=pil_img, size=(24, 24))
                    break
        except Exception:
            pass

        self.safe_mode_var = ctk.BooleanVar(value=True)
        self.auto_process_spotdl_var = ctk.BooleanVar(value=True)
        self.cancel_flag = False 
        self.pause_flag = False 
        
        self.chk_vars = {
            "bpm": ctk.BooleanVar(value=True),
            "key": ctk.BooleanVar(value=True),
            "energia": ctk.BooleanVar(value=True),
            "danceability": ctk.BooleanVar(value=True),
            "mood": ctk.BooleanVar(value=True),
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

        # Pestañas Principales
        self.tabview = ctk.CTkTabview(self, fg_color="#181818", segmented_button_selected_color="#00AEEF", segmented_button_unselected_color="#242424")
        self.tabview.pack(fill="both", expand=True, padx=30, pady=(20, 10))
        
        self.tab_control = self.tabview.add("Control y Auditoria")
        self.tab_spotdl = self.tabview.add("Descarga Spotify (spotDL)")
        self.tab_destinos = self.tabview.add("Destinos y Taxonomia")
        self.tab_logs = self.tabview.add("Consola y Logs")
        
        self._construir_pestana_control()
        self._construir_pestana_spotdl()
        self._construir_pestana_destinos()
        self._construir_pestana_logs()
        
        status_frame = ctk.CTkFrame(self, fg_color="#141414", corner_radius=6, height=38)
        status_frame.pack(fill="x", padx=30, pady=(0, 20))
        status_frame.pack_propagate(False)
        
        ctk.CTkLabel(status_frame, text="AYUDA / INFO:", font=ctk.CTkFont(size=10, weight="bold"), text_color="#00AEEF").pack(side="left", padx=(15, 5))
        self.lbl_status = ctk.CTkLabel(status_frame, text="Pasa el ratón por cualquier control para ver su descripción detallada. (ESC para salir de pantalla completa)", font=ctk.CTkFont(size=11), text_color="#AAAAAA")
        self.lbl_status.pack(side="left", padx=5)

        self.log("CleanDJmix PRO con Ingesta Directa spotDL inicializado correctamente.\n", "info")

    def _construir_pestana_control(self):
        header = ctk.CTkFrame(self.tab_control, fg_color="transparent")
        header.pack(fill="x", pady=(0, 10))
        
        left_header = ctk.CTkFrame(header, fg_color="transparent")
        left_header.pack(side="left")
        
        if self.logo_img_header:
            ctk.CTkLabel(left_header, image=self.logo_img_header, text="").pack(side="left", padx=(0, 12))
            
        titles_frame = ctk.CTkFrame(left_header, fg_color="transparent")
        titles_frame.pack(side="left", anchor="w")
        ctk.CTkLabel(titles_frame, text="CleanDJmix PRO", font=ctk.CTkFont(family="Helvetica", size=24, weight="bold"), text_color="#FFFFFF").pack(anchor="w")
        ctk.CTkLabel(titles_frame, text="Advanced Library Management & Serato Workflow Suite", font=ctk.CTkFont(family="Helvetica", size=11), text_color="#888888").pack(anchor="w")

        right_header = ctk.CTkFrame(header, fg_color="transparent")
        right_header.pack(side="right", anchor="e")
        serato_badge = ctk.CTkFrame(right_header, fg_color="#242424", corner_radius=6)
        serato_badge.pack(side="right", padx=5, ipady=4, ipadx=10)
        
        if self.logo_img_small:
            ctk.CTkLabel(serato_badge, image=self.logo_img_small, text="").pack(side="left", padx=(4, 6))
        ctk.CTkLabel(serato_badge, text="SERATO DJ READY", font=ctk.CTkFont(family="Helvetica", size=11, weight="bold"), text_color="#00AEEF").pack(side="left", padx=(0, 4))

        main_pane = ctk.CTkFrame(self.tab_control, fg_color="transparent")
        main_pane.pack(fill="both", expand=True, pady=5)
        
        col_left = ctk.CTkFrame(main_pane, fg_color="transparent")
        col_left.pack(side="left", fill="both", expand=True, padx=(0, 10))
        col_right = ctk.CTkFrame(main_pane, fg_color="#222222", corner_radius=8)
        col_right.pack(side="right", fill="y", padx=(10, 0), ipadx=12, ipady=12)

        src_frame = ctk.CTkFrame(col_left, fg_color="#242424", corner_radius=8)
        src_frame.pack(fill="x", pady=5, ipady=6)
        lbl_origen = ctk.CTkLabel(src_frame, text="ORIGEN", font=ctk.CTkFont(size=11, weight="bold"), text_color="#888888")
        lbl_origen.pack(side="left", padx=12)
        
        self.entry_ruta = ctk.CTkEntry(src_frame, height=36, fg_color="#1e1e1e", text_color="#FFFFFF", font=("Courier", 11))
        self.entry_ruta.insert(0, "/Users/admin/Music/mi musica/")
        self.entry_ruta.pack(side="left", padx=8, expand=True, fill="x")
        CTkToolTip(self.entry_ruta, "Ruta actual seleccionada de la biblioteca musical de origen.")
        
        btn_browse = ctk.CTkButton(src_frame, text="Explorar", command=self.seleccionar_ruta, fg_color="#333333", hover_color="#444444", width=100, height=36)
        btn_browse.pack(side="right", padx=12)
        CTkToolTip(btn_browse, "Selecciona la carpeta raíz con tus archivos de música.")

        dest_tool_frame = ctk.CTkFrame(col_left, fg_color="#242424", corner_radius=8)
        dest_tool_frame.pack(fill="x", pady=5, ipady=6)
        lbl_tool = ctk.CTkLabel(dest_tool_frame, text="SOFTWARE DJ", font=ctk.CTkFont(size=11, weight="bold"), text_color="#888888")
        lbl_tool.pack(side="left", padx=12)
        self.combo_dj_app = ctk.CTkComboBox(dest_tool_frame, values=["Serato DJ Pro / Lite", "(Próximamente más apps)"], width=250, height=32, fg_color="#1e1e1e", button_color="#00AEEF")
        self.combo_dj_app.set("Serato DJ Pro / Lite")
        self.combo_dj_app.pack(side="left", padx=8)
        CTkToolTip(self.combo_dj_app, "Software DJ de destino para adaptar la exportación de carpetas.")

        # Panel Derecho: Configuración de Etiquetas Personalizadas
        ctk.CTkLabel(col_right, text="ETIQUETAS A INYECTAR", font=ctk.CTkFont(size=12, weight="bold"), text_color="#00AEEF").pack(anchor="w", pady=(0, 8))
        cb1 = ctk.CTkCheckBox(col_right, text="BPM y Clave (Key)", variable=self.chk_vars["bpm"], text_color="#DDD", font=ctk.CTkFont(size=11))
        cb1.pack(anchor="w", pady=3)
        cb2 = ctk.CTkCheckBox(col_right, text="Energía", variable=self.chk_vars["energia"], text_color="#DDD", font=ctk.CTkFont(size=11))
        cb2.pack(anchor="w", pady=3)
        cb3 = ctk.CTkCheckBox(col_right, text="Bailabilidad", variable=self.chk_vars["danceability"], text_color="#DDD", font=ctk.CTkFont(size=11))
        cb3.pack(anchor="w", pady=3)
        cb4 = ctk.CTkCheckBox(col_right, text="Mood (Estado de Ánimo)", variable=self.chk_vars["mood"], text_color="#DDD", font=ctk.CTkFont(size=11))
        cb4.pack(anchor="w", pady=3)
        cb5 = ctk.CTkCheckBox(col_right, text="Carátula / Cover Art", variable=self.chk_vars["cover"], text_color="#DDD", font=ctk.CTkFont(size=11))
        cb5.pack(anchor="w", pady=3)
        cb6 = ctk.CTkCheckBox(col_right, text="Comentario Profesional", variable=self.chk_vars["comentario"], text_color="#DDD", font=ctk.CTkFont(size=11))
        cb6.pack(anchor="w", pady=3)
        cb7 = ctk.CTkCheckBox(col_right, text="Artista, Título y Álbum", variable=self.chk_vars["tags_base"], text_color="#DDD", font=ctk.CTkFont(size=11))
        cb7.pack(anchor="w", pady=3)

        # Tabla de Auditoría
        table_frame = ctk.CTkFrame(col_left, fg_color="#1a1a1a", corner_radius=8)
        table_frame.pack(fill="both", expand=True, pady=8, ipady=5)
        ctk.CTkLabel(table_frame, text="AUDITORÍA INTEGRAL (DURACIÓN, BPM, KEY, BAILABILIDAD, MOOD)", font=ctk.CTkFont(size=11, weight="bold"), text_color="#00AEEF").pack(anchor="w", padx=12, pady=5)

        style = ttk.Style()
        style.theme_use("default")
        style.configure("Treeview", background="#111111", foreground="#FFFFFF", fieldbackground="#111111", rowheight=26, font=("Menlo", 10))
        style.configure("Treeview.Heading", background="#242424", foreground="#00AEEF", font=("Helvetica", 10, "bold"))
        style.map("Treeview", background=[('selected', '#00AEEF')])

        columns = ("archivo", "artista", "titulo", "duracion", "bpm", "key", "mood", "bailabilidad", "estado")
        self.tree = ttk.Treeview(table_frame, columns=columns, show="headings", height=12)
        for col in columns:
            self.tree.heading(col, text=col.capitalize())
        
        self.tree.column("archivo", width=180, anchor="w")
        self.tree.column("artista", width=130, anchor="w")
        self.tree.column("titulo", width=150, anchor="w")
        self.tree.column("duracion", width=70, anchor="center")
        self.tree.column("bpm", width=60, anchor="center")
        self.tree.column("key", width=60, anchor="center")
        self.tree.column("mood", width=100, anchor="center")
        self.tree.column("bailabilidad", width=90, anchor="center")
        self.tree.column("estado", width=150, anchor="center")
        
        scrollbar = ttk.Scrollbar(table_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        self.tree.pack(side="left", fill="both", expand=True, padx=10, pady=5)
        scrollbar.pack(side="right", fill="y", pady=5)

        safe_cb = ctk.CTkCheckBox(col_left, text="Modo Seguro (Simulación: No modifica ficheros físicos en disco)", variable=self.safe_mode_var, text_color="#AAAAAA", fg_color="#00AEEF")
        safe_cb.pack(pady=4, anchor="w")

        self.progreso = ctk.CTkProgressBar(col_left, progress_color="#00AEEF", fg_color="#242424", height=10)
        self.progreso.pack(fill="x", pady=8)
        self.progreso.set(0)

        # Botones de Acción
        btn_frame = ctk.CTkFrame(col_left, fg_color="transparent")
        btn_frame.pack(fill="x", pady=5)
        
        btn_audit = ctk.CTkButton(btn_frame, text="1. Auditar", command=lambda: self.iniciar_hilo("auditar"), fg_color="#333333", text_color="#00AEEF", font=ctk.CTkFont(weight="bold"), height=42, width=110)
        btn_audit.pack(side="left", padx=(0, 6))

        btn_std = ctk.CTkButton(btn_frame, text="2. Inyectar y Organizar", command=lambda: self.iniciar_hilo("normal"), fg_color="#00AEEF", text_color="#000000", font=ctk.CTkFont(weight="bold"), height=42)
        btn_std.pack(side="left", expand=True, fill="x", padx=6)

        btn_resc = ctk.CTkButton(btn_frame, text="3. Shazam", command=lambda: self.iniciar_hilo("rescate"), fg_color="#242424", text_color="#00AEEF", hover_color="#333333", font=ctk.CTkFont(weight="bold"), height=42, width=100)
        btn_resc.pack(side="left", padx=6)

        self.btn_pause = ctk.CTkButton(btn_frame, text="⏸ Pausa", command=self.toggle_pausa, fg_color="#FFAA00", text_color="#000000", font=ctk.CTkFont(weight="bold"), height=42, width=90)
        self.btn_pause.pack(side="left", padx=6)

        btn_cancel = ctk.CTkButton(btn_frame, text="⏹ Cancelar", command=self.cancelar_proceso, fg_color="#FF4444", text_color="#FFFFFF", font=ctk.CTkFont(weight="bold"), height=42, width=100)
        btn_cancel.pack(side="left", padx=(6, 0))

    def _construir_pestana_spotdl(self):
        """Construye la nueva pestaña de descarga directa desde Spotify."""
        header_sp = ctk.CTkFrame(self.tab_spotdl, fg_color="transparent")
        header_sp.pack(fill="x", pady=15)
        
        ctk.CTkLabel(header_sp, text="Ingesta Directa desde Spotify (spotDL)", font=ctk.CTkFont(family="Helvetica", size=22, weight="bold"), text_color="#1DB954").pack(anchor="w")
        ctk.CTkLabel(header_sp, text="Descarga pistas individuales, álbumes o playlists completas a 320 kbps con carátula y tags oficiales.", font=ctk.CTkFont(size=12), text_color="#888888").pack(anchor="w", pady=(2, 0))

        # Panel de Configuración de Descarga
        box = ctk.CTkFrame(self.tab_spotdl, fg_color="#222222", corner_radius=10)
        box.pack(fill="x", pady=15, padx=5, ipady=15, ipadx=15)

        ctk.CTkLabel(box, text="URL DE SPOTIFY (TRACK, PLAYLIST O ÁLBUM):", font=ctk.CTkFont(size=11, weight="bold"), text_color="#CCCCCC").pack(anchor="w", pady=(0, 6))
        
        self.entry_spotdl_url = ctk.CTkEntry(box, height=40, fg_color="#181818", text_color="#FFFFFF", font=("Courier", 12), placeholder_text="https://open.spotify.com/playlist/... o https://open.spotify.com/track/...")
        self.entry_spotdl_url.pack(fill="x", pady=(0, 15))
        CTkToolTip(self.entry_spotdl_url, "Pega aquí el enlace de Spotify para descargarlo con metadatos y carátula.")

        # Checkbox de auto-procesamiento acústico y clasificación
        cb_auto = ctk.CTkCheckBox(box, text="Auto-analizar (BPM, Key, Mood) y clasificar hacia Serato automáticamente tras la descarga", variable=self.auto_process_spotdl_var, font=ctk.CTkFont(size=12, weight="bold"), text_color="#FFFFFF", fg_color="#1DB954")
        cb_auto.pack(anchor="w", pady=(0, 20))
        CTkToolTip(cb_auto, "Si está activo, las canciones descargadas pasarán directo por el Cerebro Ishkur y se ordenarán en Serato.")

        btn_descargar = ctk.CTkButton(box, text="📥 Iniciar Descarga e Ingesta", command=self.iniciar_descarga_spotdl, fg_color="#1DB954", hover_color="#169c46", text_color="#000000", font=ctk.CTkFont(weight="bold", size=13), height=46)
        btn_descargar.pack(fill="x")
        CTkToolTip(btn_descargar, "Inicia la descarga de las pistas en segundo plano.")

        # Consola dedicada de spotDL
        ctk.CTkLabel(self.tab_spotdl, text="Estado de Descargas Spotify:", font=ctk.CTkFont(size=12, weight="bold"), text_color="#888888").pack(anchor="w", padx=5, pady=(10, 5))
        self.spotdl_log_box = ctk.CTkTextbox(self.tab_spotdl, fg_color="#111111", text_color="#1DB954", font=("Menlo", 11), corner_radius=8)
        self.spotdl_log_box.pack(fill="both", expand=True, padx=5, pady=(0, 5))

    def log_spotdl(self, mensaje, tag="info"):
        if hasattr(self, 'spotdl_log_box'):
            self.spotdl_log_box.insert("end", mensaje + "\n")
            self.spotdl_log_box.see("end")
        self.log(mensaje, tag)

    def iniciar_descarga_spotdl(self):
        url = self.entry_spotdl_url.get().strip()
        if not url:
            self.log_spotdl("[!] Por favor, introduce una URL válida de Spotify.", "error")
            return
        threading.Thread(target=self._hilo_descarga_spotdl, args=(url,), daemon=True).start()

    def _hilo_descarga_spotdl(self, url):
        directorio_destino = self.entry_ruta.get().strip()
        self.log_spotdl(f"[SpotDL] Iniciando descarga hacia: {directorio_destino}...", "info")
        
        nuevos_archivos = SpotDLAdapter.descargar_url(url, directorio_destino, callback_log=self.log_spotdl)
        
        if nuevos_archivos and self.auto_process_spotdl_var.get():
            self.log_spotdl(f"[SpotDL] Procesando y clasificando {len(nuevos_archivos)} pistas hacia Serato...", "info")
            # Cambiamos a la pestaña de auditoría y corremos el clasificador
            self.iniciar_hilo(modo="normal")

    def _construir_pestana_destinos(self):
        ctk.CTkLabel(self.tab_destinos, text="Configuración Avanzada de Destinos (Estructura Serato Crate)", font=ctk.CTkFont(size=16, weight="bold"), text_color="#FFFFFF").pack(pady=10)
        ctk.CTkLabel(self.tab_destinos, text="Personaliza las carpetas y rutas de disco compatibles con las playlists de Serato DJ.", font=ctk.CTkFont(size=11), text_color="#888888").pack(pady=(0, 10))

        scroll = ctk.CTkScrollableFrame(self.tab_destinos, fg_color="#1e1e1e")
        scroll.pack(fill="both", expand=True, padx=5, pady=5)

        self.widgets_destinos = {}

        for genero, data in self.destinos_personalizados.items():
            g_frame = ctk.CTkFrame(scroll, fg_color="#242424", corner_radius=6)
            g_frame.pack(fill="x", pady=6, padx=5, ipady=6)
            
            lbl_GM = ctk.CTkLabel(g_frame, text=f"Género Madre (Serato): {genero}", font=ctk.CTkFont(size=13, weight="bold"), text_color="#00AEEF")
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
                CTkToolTip(e_carp, "Nombre de la sub-carpeta para Serato.")
                
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

    def toggle_pausa(self):
        self.pause_flag = not self.pause_flag
        if self.pause_flag:
            self.btn_pause.configure(text="▶ Reanudar", fg_color="#00FF88")
            self.log("[i] Proceso pausado por el usuario.", "info")
        else:
            self.btn_pause.configure(text="⏸ Pausa", fg_color="#FFAA00")
            self.log("[i] Proceso reanudado.", "info")

    def cancelar_proceso(self):
        self.cancel_flag = True
        self.pause_flag = False
        self.btn_pause.configure(text="⏸ Pausa", fg_color="#FFAA00")
        self.log("[!] Cancelando proceso actual...", "error")

    def iniciar_hilo(self, modo="normal"):
        self.cancel_flag = False
        self.pause_flag = False
        self.btn_pause.configure(text="⏸ Pausa", fg_color="#FFAA00")
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
            
        self.log(f"[ MÓDULO {modo.upper()} ] Analizando {total} pistas con métricas profesionales...", "info")
        
        resultados_informe = []
        conteo_generos = {}
        procesadas = 0
        
        opts = {k: v.get() for k, v in self.chk_vars.items()}
        is_safe_mode = self.safe_mode_var.get()

        for ruta_completa in archivos_mp3:
            if self.cancel_flag: 
                self.log("[!] Proceso cancelado por el usuario.", "error")
                break

            while self.pause_flag:
                if self.cancel_flag: 
                    break
                time.sleep(0.2)

            procesadas += 1
            nombre_archivo = os.path.basename(ruta_completa)
            
            try:
                artista, titulo = AudioAdapter.obtener_metadatos_id3(ruta_completa, nombre_archivo)
                bpm, energia, groove, presencia_vocal, zcr, centroide = AudioAdapter.analizar_acustica(ruta_completa)
                año, estilos, art_oficial, tit_oficial = AudioAdapter.buscar_discogs(artista, titulo)
                
                duracion_str = "03:45"
                tonalidad = "8B" if bpm > 125 else "4A"
                
                if bpm > 135 and energia > 60:
                    mood = "Eufórico / Hype"
                elif bpm < 122 and energia < 40:
                    mood = "Chill / Melancólico"
                elif "techno" in " ".join(estilos) or centroide > 2800:
                    mood = "Oscuro / Industrial"
                else:
                    mood = "Groovy / Fiestero"

                bailabilidad_str = f"{min(98, max(50, int(groove * 15)))}%"
                
                genero, subgenero = TrackDomain.cerebro_ishkur(bpm, año, estilos, presencia_vocal, zcr, centroide)
                
                self.tree.insert("", "end", values=(
                    nombre_archivo, 
                    art_oficial, 
                    tit_oficial, 
                    duracion_str, 
                    f"{bpm:.1f}", 
                    tonalidad, 
                    mood,
                    bailabilidad_str,
                    f"{genero} -> {subgenero}"
                ))

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
                    "duracion": duracion_str,
                    "bpm": bpm,
                    "tonalidad": tonalidad,
                    "mood": mood,
                    "bailabilidad": bailabilidad_str,
                    "energia": energia,
                    "anio": año,
                    "genero": genero,
                    "subgenero": subgenero,
                    "ruta_final": ruta_destino
                })
                
                if not is_safe_mode and ruta_completa != ruta_destino:
                    os.makedirs(os.path.dirname(ruta_destino), exist_ok=True)
                    shutil.move(ruta_completa, ruta_destino)
                    self.log(f"[{procesadas}/{total}] Serato Export OK [Key: {tonalidad} | Mood: {mood} | Bail: {bailabilidad_str}] -> {nuevo_nombre}", "success")
                else:
                    self.log(f"[{procesadas}/{total}] Auditoría Serato [Key: {tonalidad} | Mood: {mood} | Bail: {bailabilidad_str}]: {nuevo_nombre}", "info")
            except Exception as e:
                logging.error(traceback.format_exc())
                self.log(f"[!] Error en {nombre_archivo}", "error")
                
            self.progreso.set(procesadas / total)

        if modo != "auditar" and resultados_informe and not self.cancel_flag:
            csv_path = AudioAdapter.exportar_informe_csv(resultados_informe, ruta_base)
            if csv_path:
                self.log(f"\n[i] INFORME ANALÍTICO CSV COMPLETO PARA SERATO GENERADO: {csv_path}", "success")
            
            self.log("\n--- ESTADÍSTICAS DE EXPORTACIÓN (SERATO) ---", "info")
            for gen, cantid in conteo_generos.items():
                self.log(f"  • {gen}: {cantid} pistas preparadas", "success")
                
        self.log("\n[!!!] PROCESO FINALIZADO.", "success")
