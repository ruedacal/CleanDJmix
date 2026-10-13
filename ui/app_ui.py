from application.analysis_service import AudioAnalysisService
from application.taxonomy_service import TaxonomyService
from application.audio_player import MacAudioPlayer
from application.stream_service import AudioStreamService
import os
import math
import tempfile
import tkinter as tk
import pygame
import io
import requests
from PIL import Image, ImageTk
"""
Módulo de Interfaz Gráfica (UI): CleanDJmix PRO con selección interactiva 
por checks para spotDL (Carátula, Título, Artista, Álbum, Duración) y exportación a Serato.
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
from infrastructure.adapters import AudioAdapter, SpotifyDownloaderAdapter

ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

logging.basicConfig(filename='CleanDJmix_crash.log', level=logging.ERROR, format='%(asctime)s - [CleanDJmix Error] - %(message)s')

class CTkToolTip:
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
                if not self.widget.winfo_exists(): return
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
        
        try:
            self.attributes("-fullscreen", True)
            self.bind("<Escape>", lambda e: self.attributes("-fullscreen", False))
        except Exception:
            try:
                self.state("-zoomed")
            except Exception:
                self.geometry("1400x900")

        self.resizable(True, True)
        
        # Logos corporativos
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
        self.auto_process_spotify_dl_var = ctk.BooleanVar(value=True)
        self.cancel_flag = False 
        self.pause_flag = False 
        
        # Almacenamiento de pistas de Spotify escaneadas
        self.spotify_dl_songs_data = [] 
        
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

        self.tabview = ctk.CTkTabview(self, fg_color="#181818", segmented_button_selected_color="#00AEEF", segmented_button_unselected_color="#242424")
        self.tabview.pack(fill="both", expand=True, padx=30, pady=(20, 10))
        
        self.tab_control = self.tabview.add("Control y Auditoria")
        self.tab_spotify_dl = self.tabview.add("Descargador Spotify")
        self.tab_destinos = self.tabview.add("Destinos y Taxonomia")
        self.tab_logs = self.tabview.add("Consola y Logs")
        
        self._construir_pestana_control()
        self._construir_pestana_spotify_dl()
        self._construir_pestana_destinos()
        self._construir_pestana_logs()
        
        status_frame = ctk.CTkFrame(self, fg_color="#141414", corner_radius=6, height=38)
        status_frame.pack(fill="x", padx=30, pady=(0, 20))
        status_frame.pack_propagate(False)
        
        ctk.CTkLabel(status_frame, text="AYUDA / INFO:", font=ctk.CTkFont(size=10, weight="bold"), text_color="#00AEEF").pack(side="left", padx=(15, 5))
        self.lbl_status = ctk.CTkLabel(status_frame, text="Pasa el raton por cualquier control para ver su descripcion. (ESC para salir de pantalla completa)", font=ctk.CTkFont(size=11), text_color="#AAAAAA")
        self.lbl_status.pack(side="left", padx=5)

        self.log("CleanDJmix PRO con Selector Selectivo spotDL cargado correctamente.\n", "info")

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

        dest_tool_frame = ctk.CTkFrame(col_left, fg_color="#242424", corner_radius=8)
        dest_tool_frame.pack(fill="x", pady=5, ipady=6)
        lbl_tool = ctk.CTkLabel(dest_tool_frame, text="SOFTWARE DJ", font=ctk.CTkFont(size=11, weight="bold"), text_color="#888888")
        lbl_tool.pack(side="left", padx=12)
        self.combo_dj_app = ctk.CTkComboBox(dest_tool_frame, values=["Serato DJ Pro / Lite", "(Proximamente mas apps)"], width=250, height=32, fg_color="#1e1e1e", button_color="#00AEEF")
        self.combo_dj_app.set("Serato DJ Pro / Lite")
        self.combo_dj_app.pack(side="left", padx=8)

        # Panel Derecho: Configuración de Etiquetas Personalizadas
        ctk.CTkLabel(col_right, text="ETIQUETAS A INYECTAR", font=ctk.CTkFont(size=12, weight="bold"), text_color="#00AEEF").pack(anchor="w", pady=(0, 8))
        for key, text in [("bpm", "BPM y Clave (Key)"), ("energia", "Energia"), ("danceability", "Bailabilidad"), 
                          ("mood", "Mood (Estado de Animo)"), ("cover", "Caratula / Cover Art"), 
                          ("comentario", "Comentario Profesional"), ("tags_base", "Artista, Titulo y Album")]:
            ctk.CTkCheckBox(col_right, text=text, variable=self.chk_vars[key], text_color="#DDD", font=ctk.CTkFont(size=11)).pack(anchor="w", pady=3)

        # Tabla de Auditoría
        table_frame = ctk.CTkFrame(col_left, fg_color="#1a1a1a", corner_radius=8)
        table_frame.pack(fill="both", expand=True, pady=8, ipady=5)
        ctk.CTkLabel(table_frame, text="AUDITORIA INTEGRAL (DURACION, BPM, KEY, BAILABILIDAD, MOOD)", font=ctk.CTkFont(size=11, weight="bold"), text_color="#00AEEF").pack(anchor="w", padx=12, pady=5)

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

        safe_cb = ctk.CTkCheckBox(col_left, text="Modo Seguro (Simulacion: No modifica ficheros fisicos en disco)", variable=self.safe_mode_var, text_color="#AAAAAA", fg_color="#00AEEF")
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

        self.btn_pause = ctk.CTkButton(btn_frame, text="|| Pausa", command=self.toggle_pausa, fg_color="#FFAA00", text_color="#000000", font=ctk.CTkFont(weight="bold"), height=42, width=90)
        self.btn_pause.pack(side="left", padx=6)

        btn_cancel = ctk.CTkButton(btn_frame, text="[X] Cancelar", command=self.cancelar_proceso, fg_color="#FF4444", text_color="#FFFFFF", font=ctk.CTkFont(weight="bold"), height=42, width=100)
        btn_cancel.pack(side="left", padx=(6, 0))

    def _construir_pestana_spotify_dl(self):
        """Pestaña spotDL con selección individual de pistas y Deck DJ de preescucha."""
        header_sp = ctk.CTkFrame(self.tab_spotify_dl, fg_color="transparent")
        header_sp.pack(fill="x", pady=10)
        
        ctk.CTkLabel(header_sp, text="Ingesta Directa desde Spotify (spotDL)", font=ctk.CTkFont(family="Helvetica", size=22, weight="bold"), text_color="#1DB954").pack(anchor="w")
        ctk.CTkLabel(header_sp, text="Escanea playlists o tracks, selecciona que canciones descargar y organizalas directamente a Serato.", font=ctk.CTkFont(size=12), text_color="#888888").pack(anchor="w", pady=(2, 0))

        # Panel Superior de Busqueda
        box_search = ctk.CTkFrame(self.tab_spotify_dl, fg_color="#222222", corner_radius=8)
        box_search.pack(fill="x", pady=10, padx=5, ipady=10, ipadx=10)

        ctk.CTkLabel(box_search, text="URL DE SPOTIFY (PLAYLIST, ALBUM O TRACK):", font=ctk.CTkFont(size=11, weight="bold"), text_color="#CCCCCC").pack(anchor="w", pady=(0, 4))
        
        url_input_frame = ctk.CTkFrame(box_search, fg_color="transparent")
        url_input_frame.pack(fill="x")

        self.entry_spotify_dl_url = ctk.CTkEntry(url_input_frame, height=38, fg_color="#181818", text_color="#FFFFFF", font=("Courier", 11), placeholder_text="https://open.spotify.com/playlist/... o track/...")
        self.entry_spotify_dl_url.pack(side="left", expand=True, fill="x", padx=(0, 10))

        self.btn_scan = ctk.CTkButton(url_input_frame, text="1. Cargar Lista", command=self.iniciar_escaneo_spotify_dl, fg_color="#333333", text_color="#1DB954", font=ctk.CTkFont(weight="bold"), height=38, width=140)
        self.btn_scan.pack(side="right")
        CTkToolTip(self.btn_scan, "Busca los metadatos y muestra el listado con checks antes de descargar.")

        # Barra de Seleccion Rapida y Acciones
        action_bar = ctk.CTkFrame(self.tab_spotify_dl, fg_color="transparent")
        action_bar.pack(fill="x", padx=5, pady=5)

        self.lbl_conteo_sel = ctk.CTkLabel(action_bar, text="Pistas encontradas: 0 | Seleccionadas: 0", font=ctk.CTkFont(size=12, weight="bold"), text_color="#FFFFFF")
        self.lbl_conteo_sel.pack(side="left", padx=5)

        btn_select_all = ctk.CTkButton(action_bar, text="Marcar Todas", command=lambda: self._set_all_checks(True), fg_color="#2b2b2b", width=110, height=30)
        btn_select_all.pack(side="left", padx=6)

        btn_unselect_all = ctk.CTkButton(action_bar, text="Desmarcar Todas", command=lambda: self._set_all_checks(False), fg_color="#2b2b2b", width=120, height=30)
        btn_unselect_all.pack(side="left", padx=6)

        cb_auto = ctk.CTkCheckBox(action_bar, text="Auto-clasificar a Serato tras descarga", variable=self.auto_process_spotify_dl_var, font=ctk.CTkFont(size=11), text_color="#DDD", fg_color="#1DB954")
        cb_auto.pack(side="right", padx=10)

        # Contenedor Desplazable con el Listado de Canciones y Checks
        self.spotify_dl_scroll_list = ctk.CTkScrollableFrame(self.tab_spotify_dl, fg_color="#161616", corner_radius=8, height=230)
        self.spotify_dl_scroll_list.pack(fill="both", expand=True, padx=5, pady=5)

        # Encabezado de la lista
        list_header = ctk.CTkFrame(self.spotify_dl_scroll_list, fg_color="#202020", corner_radius=4, height=30)
        list_header.pack(fill="x", pady=(0, 5), ipady=3)
        ctk.CTkLabel(list_header, text="SEL", width=45, font=ctk.CTkFont(size=11, weight="bold"), text_color="#00AEEF").pack(side="left", padx=5)
        ctk.CTkLabel(list_header, text="COVER", width=45, font=ctk.CTkFont(size=11, weight="bold"), text_color="#00AEEF").pack(side="left", padx=5)
        ctk.CTkLabel(list_header, text="TITULO", width=250, anchor="w", font=ctk.CTkFont(size=11, weight="bold"), text_color="#00AEEF").pack(side="left", padx=5)
        ctk.CTkLabel(list_header, text="ARTISTA", width=200, anchor="w", font=ctk.CTkFont(size=11, weight="bold"), text_color="#00AEEF").pack(side="left", padx=5)
        ctk.CTkLabel(list_header, text="DURACION", width=80, anchor="center", font=ctk.CTkFont(size=11, weight="bold"), text_color="#00AEEF").pack(side="left", padx=5)
        ctk.CTkLabel(list_header, text="PREVIEW", width=80, anchor="center", font=ctk.CTkFont(size=11, weight="bold"), text_color="#00AEEF").pack(side="right", padx=10)

        # --- PANEL DOCK DE PREESCUCHA DJ ---
        self.dock_player = ctk.CTkFrame(self.tab_spotify_dl, fg_color="#151515", corner_radius=8, height=54)
        self.dock_player.pack(fill="x", padx=5, pady=(2, 6))

        self.dock_cover = ctk.CTkLabel(self.dock_player, text="DJ", width=42, height=42, fg_color="#242424", corner_radius=4, font=ctk.CTkFont(size=11, weight="bold"))
        self.dock_cover.pack(side="left", padx=8, pady=6)

        dock_meta = ctk.CTkFrame(self.dock_player, fg_color="transparent", width=200)
        dock_meta.pack(side="left", fill="y", padx=4, pady=6)
        dock_meta.pack_propagate(False)

        self.dock_titulo = ctk.CTkLabel(dock_meta, text="Selecciona un track...", font=ctk.CTkFont(size=11, weight="bold"), text_color="#FFFFFF", anchor="w")
        self.dock_titulo.pack(fill="x")
        self.dock_artista = ctk.CTkLabel(dock_meta, text="CleanDJmix Deck", font=ctk.CTkFont(size=10), text_color="#888888", anchor="w")
        self.dock_artista.pack(fill="x")

        self.btn_dock_play = ctk.CTkButton(self.dock_player, text="PLAY", width=75, height=34, fg_color="#00AEEF", hover_color="#0090c7", text_color="#000000", font=ctk.CTkFont(size=11, weight="bold"), command=self._toggle_dock_play)
        self.btn_dock_play.pack(side="right", padx=8, pady=10)

        self.btn_dock_stop = ctk.CTkButton(self.dock_player, text="CUE", width=60, height=34, fg_color="#282828", hover_color="#353535", text_color="#FFFFFF", font=ctk.CTkFont(size=11, weight="bold"), command=self._stop_dock_play)
        self.btn_dock_stop.pack(side="right", padx=4, pady=10)

        self.dock_wave_canvas = tk.Canvas(self.dock_player, bg="#0d0d0d", height=36, bd=0, highlightthickness=1, highlightbackground="#222222")
        self.dock_wave_canvas.pack(side="left", fill="both", expand=True, padx=8, pady=8)

        # Boton para descargar unicamente las seleccionadas
        self.btn_descargar_sel = ctk.CTkButton(self.tab_spotify_dl, text="[>] 2. Descargar Canciones Seleccionadas", command=self.iniciar_descarga_seleccionadas, fg_color="#1DB954", hover_color="#169c46", text_color="#000000", font=ctk.CTkFont(weight="bold", size=13), height=40)
        self.btn_descargar_sel.pack(fill="x", padx=5, pady=6)

        # Registro de estado
        self.spotify_dl_log_box = ctk.CTkTextbox(self.tab_spotify_dl, fg_color="#111111", text_color="#1DB954", font=("Menlo", 11), corner_radius=8, height=75)
        self.spotify_dl_log_box.pack(fill="x", padx=5, pady=(0, 5))

    def log_spotify_dl(self, mensaje, tag="info"):
        if hasattr(self, 'spotify_dl_log_box'):
            self.spotify_dl_log_box.insert("end", mensaje + "\n")
            self.spotify_dl_log_box.see("end")
        self.log(mensaje, tag)

    def iniciar_escaneo_spotify_dl(self):
        url = self.entry_spotify_dl_url.get().strip()
        if not url:
            self.log_spotify_dl("[!] Introduce una URL valida de Spotify.", "error")
            return
        self.btn_scan.configure(state="disabled", text="Buscando...")
        threading.Thread(target=self._hilo_escanear_spotify_dl, args=(url,), daemon=True).start()

    def _hilo_escanear_spotify_dl(self, url):
        self.log_spotify_dl(f"[Spotify] Obteniendo lista de canciones para: {url}...", "info")
        canciones = SpotifyDownloaderAdapter.escanear_lista(url, callback_log=self.log_spotify_dl)
        
        def pintar_gui():
            self.btn_scan.configure(state="normal", text="1. Cargar Lista")
            for w in self.spotify_dl_scroll_list.winfo_children()[1:]:
                w.destroy()

            self.spotify_dl_songs_data = []

            for item in canciones:
                var_chk = ctk.BooleanVar(value=True)
                self.spotify_dl_songs_data.append({
                    "data": item,
                    "var": var_chk
                })

                row = ctk.CTkFrame(self.spotify_dl_scroll_list, fg_color="#181818", corner_radius=4, height=42)
                row.pack(fill="x", pady=2, padx=4)

                # 1. Check
                chk = ctk.CTkCheckBox(row, text="", variable=var_chk, width=36, command=self._actualizar_contador_sel, fg_color="#1DB954")
                chk.pack(side="left", padx=6)

                # 2. Cover Box
                lbl_cover = ctk.CTkLabel(row, text="DJ", width=36, height=36, fg_color="#242424", corner_radius=3, font=ctk.CTkFont(size=10, weight="bold"))
                lbl_cover.pack(side="left", padx=4)
                if item.get("cover_url"):
                    self._cargar_cover_async(item.get("cover_url"), lbl_cover)

                # 3. Textos
                ctk.CTkLabel(row, text=str(item.get("titulo", ""))[:32], width=250, anchor="w", font=ctk.CTkFont(size=11, weight="bold"), text_color="#FFFFFF").pack(side="left", padx=6)
                ctk.CTkLabel(row, text=str(item.get("artista", ""))[:26], width=200, anchor="w", font=ctk.CTkFont(size=11), text_color="#AAAAAA").pack(side="left", padx=6)
                ctk.CTkLabel(row, text=str(item.get("duracion", "00:00")), width=80, anchor="center", font=ctk.CTkFont(size=11), text_color="#00AEEF").pack(side="left", padx=4)

                # 4. Boton Cargar a Deck
                btn_load = ctk.CTkButton(row, text="Cargar", width=70, height=28, fg_color="#262626", hover_color="#333333", text_color="#00AEEF", font=ctk.CTkFont(size=11, weight="bold"))
                btn_load.pack(side="right", padx=10)
                btn_load.configure(command=lambda it=item: self._cargar_a_deck_dj(it))

            self._actualizar_contador_sel()
            self.log_spotify_dl(f"[Spotify] Se han listado {len(canciones)} pistas para seleccion.", "success")

        self.after(0, pintar_gui)

    def _actualizar_contador_sel(self):
        total = len(self.spotify_dl_songs_data)
        sel = sum(1 for item in self.spotify_dl_songs_data if item["var"].get())
        self.lbl_conteo_sel.configure(text=f"Pistas encontradas: {total} | Seleccionadas: {sel}")

    def _set_all_checks(self, valor: bool):
        for item in self.spotify_dl_songs_data:
            item["var"].set(valor)
        self._actualizar_contador_sel()

    def iniciar_descarga_seleccionadas(self):
        seleccionadas = [item["data"]["song_obj"] for item in self.spotify_dl_songs_data if item["var"].get()]
        if not seleccionadas:
            self.log_spotify_dl("[!] No hay ninguna cancion seleccionada para descargar.", "error")
            return
        threading.Thread(target=self._hilo_descarga_seleccionadas, args=(seleccionadas,), daemon=True).start()

    def _hilo_descarga_seleccionadas(self, songs_to_download):
        directorio_destino = self.entry_ruta.get().strip()
        self.btn_descargar_sel.configure(state="disabled", text="Descargando...")
        
        nuevos_archivos = SpotifyDownloaderAdapter.descargar_canciones_seleccionadas(
            songs_to_download, 
            directorio_destino, 
            callback_log=self.log_spotify_dl
        )
        
        self.btn_descargar_sel.configure(state="normal", text="[>] 2. Descargar Canciones Seleccionadas")
        
        if nuevos_archivos and self.auto_process_spotify_dl_var.get():
            self.log_spotify_dl(f"[Spotify] Analizando y organizando {len(nuevos_archivos)} pistas en Serato...", "info")
            self.iniciar_hilo(modo="normal")

    def _construir_pestana_destinos(self):
        ctk.CTkLabel(self.tab_destinos, text="Configuracion Avanzada de Destinos (Estructura Serato Crate)", font=ctk.CTkFont(size=16, weight="bold"), text_color="#FFFFFF").pack(pady=10)
        scroll = ctk.CTkScrollableFrame(self.tab_destinos, fg_color="#1e1e1e")
        scroll.pack(fill="both", expand=True, padx=5, pady=5)

        self.widgets_destinos = {}
        for genero, data in self.destinos_personalizados.items():
            g_frame = ctk.CTkFrame(scroll, fg_color="#242424", corner_radius=6)
            g_frame.pack(fill="x", pady=6, padx=5, ipady=6)
            
            ctk.CTkLabel(g_frame, text=f"Genero Madre (Serato): {genero}", font=ctk.CTkFont(size=13, weight="bold"), text_color="#00AEEF").pack(anchor="w", padx=15, pady=5)
            sub_container = ctk.CTkFrame(g_frame, fg_color="transparent")
            sub_container.pack(fill="x", padx=15, pady=2)
            
            self.widgets_destinos[genero] = {}
            for sub in TAXONOMIA_ELECTRONICA[genero]:
                s_frame = ctk.CTkFrame(sub_container, fg_color="#181818", corner_radius=4)
                s_frame.pack(fill="x", pady=3, ipady=4)
                
                ctk.CTkLabel(s_frame, text=sub, font=ctk.CTkFont(size=11), text_color="#CCCCCC", width=180, anchor="w").pack(side="left", padx=10)
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
                
                ctk.CTkButton(s_frame, text="Dir", command=elegir_path, width=45, height=32, fg_color="#333333").pack(side="right", padx=10)
                self.widgets_destinos[genero][sub] = {"carpeta": e_carp, "ruta": e_ruta}

    def obtener_configuracion_destinos(self) -> dict:
        config = {}
        for genero, sub_dict in getattr(self, "widgets_destinos", {}).items():
            config[genero] = {}
            for sub, widgets in sub_dict.items():
                carpeta = widgets["carpeta"].get().strip() if "carpeta" in widgets else sub
                ruta = widgets["ruta"].get().strip() if "ruta" in widgets else ""
                config[genero][sub] = {"carpeta": carpeta, "ruta": ruta}
        return config

    def _construir_pestana_logs(self):
        ctk.CTkLabel(self.tab_logs, text="Registro de Ejecucion en Tiempo Real (Serato Bridge)", font=ctk.CTkFont(size=14, weight="bold"), text_color="#FFFFFF").pack(pady=10, anchor="w", padx=5)
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
            self.btn_pause.configure(text="> Reanudar", fg_color="#00FF88")
            self.log("[i] Proceso pausado por el usuario.", "info")
        else:
            self.btn_pause.configure(text="|| Pausa", fg_color="#FFAA00")
            self.log("[i] Proceso reanudado.", "info")

    def cancelar_proceso(self):
        self.cancel_flag = True
        self.pause_flag = False
        self.btn_pause.configure(text="|| Pausa", fg_color="#FFAA00")
        self.log("[!] Cancelando proceso actual...", "error")

    def iniciar_hilo(self, modo="normal"):
        self.cancel_flag = False
        self.pause_flag = False
        self.btn_pause.configure(text="|| Pausa", fg_color="#FFAA00")
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
            
        self.log(f"[ MODULO {modo.upper()} ] Analizando {total} pistas con metricas profesionales...", "info")
        
        if modo == "auditar":
            service = AudioAnalysisService(max_workers=4)
            def on_progress(done, total_files, filename):
                frac = done / total_files
                self.after(0, lambda: self.progreso.set(frac))

            self.log("[Audit Service] Ejecutando analisis paralelo con ProcessPoolExecutor...", "info")
            resultados = service.escanear_directorio(
                directorio_raiz=ruta_base,
                callback_progreso=on_progress
            )

            for r in resultados:
                vals = (
                    r.get("nombre_archivo", ""),
                    r.get("artista", ""),
                    r.get("titulo", ""),
                    r.get("duracion", "0:00"),
                    r.get("bpm", 0.0),
                    r.get("key", ""),
                    "Pendiente",
                    "Pendiente",
                    "Auditado (OK)"
                )
                self.tree.insert("", "end", values=vals)

            self.progreso.set(1.0)
            self.log(f"[Audit Service] Auditoria completada con exito: {len(resultados)} tracks procesados.", "success")
            return

        resultados_informe = []
        conteo_generos = {}
        procesadas = 0
        is_safe_mode = self.safe_mode_var.get()
        taxonomy_service = TaxonomyService()
        config_destinos = self.obtener_configuracion_destinos()

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
                    mood = "Euforico / Hype"
                elif bpm < 122 and energia < 40:
                    mood = "Chill / Melancolico"
                elif "techno" in " ".join(estilos) or centroide > 2800:
                    mood = "Oscuro / Industrial"
                else:
                    mood = "Groovy / Fiestero"

                bailabilidad_str = f"{min(98, max(50, int(groove * 15)))}%"
                genero, subgenero = TrackDomain.cerebro_ishkur(bpm, año, estilos, presencia_vocal, zcr, centroide)
                
                self.tree.insert("", "end", values=(
                    nombre_archivo, art_oficial, tit_oficial, duracion_str, 
                    f"{bpm:.1f}", tonalidad, mood, bailabilidad_str, f"{genero} -> {subgenero}"
                ))

                if modo == "auditar":
                    continue

                if modo == "rescate" and (artista == "VRC_MISSING" or titulo == "VRC_MISSING"):
                    art_oficial, tit_oficial = AudioAdapter.rescate_shazam(ruta_completa)

                res_tax = taxonomy_service.organizar_pista(
                    ruta_origen=ruta_completa,
                    artista=art_oficial,
                    titulo=tit_oficial,
                    bpm=int(round(bpm)),
                    año=int(año) if str(año).isdigit() else 2026,
                    genero=genero,
                    subgenero=subgenero,
                    ruta_base=ruta_base,
                    modo_seguro=is_safe_mode,
                    config_destinos=config_destinos,
                    mover_archivo=True
                )
                
                ruta_destino = res_tax.get("ruta_destino", ruta_completa)
                nuevo_nombre = os.path.basename(ruta_destino)

                conteo_generos[genero] = conteo_generos.get(genero, 0) + 1
                resultados_informe.append({
                    "artista": art_oficial, "titulo": tit_oficial, "duracion": duracion_str,
                    "bpm": bpm, "tonalidad": tonalidad, "mood": mood, "bailabilidad": bailabilidad_str,
                    "energia": energia, "anio": año, "genero": genero, "subgenero": subgenero,
                    "ruta_final": ruta_destino
                })

                if not is_safe_mode and res_tax.get("estado") == "OK":
                    self.log(f"[{procesadas}/{total}] Serato Export OK [Key: {tonalidad} | Mood: {mood}] -> {nuevo_nombre}", "success")
                else:
                    self.log(f"[{procesadas}/{total}] Auditoria Serato [Key: {tonalidad} | Mood: {mood}]: {nuevo_nombre} ({res_tax.get("estado", "OK")})", "info")
            except Exception as e:
                logging.error(traceback.format_exc())
                self.log(f"[!] Error en {nombre_archivo}", "error")
                
            self.progreso.set(procesadas / total)

        if modo != "auditar" and resultados_informe and not self.cancel_flag:
            csv_path = AudioAdapter.exportar_informe_csv(resultados_informe, ruta_base)
            if csv_path:
                self.log(f"\n[i] INFORME ANALITICO CSV COMPLETO GENERADO: {csv_path}", "success")
            self.log("\n--- ESTADISTICAS DE EXPORTACION (SERATO) ---", "info")
            for gen, cantid in conteo_generos.items():
                self.log(f"  * {gen}: {cantid} pistas preparadas", "success")
                
        self.log("\n[!!!] PROCESO FINALIZADO.", "success")

    def _cargar_cover_async(self, url, widget):
        if not url:
            return
        if not hasattr(self, "_thumbnails_cache"):
            self._thumbnails_cache = {}
        if url in self._thumbnails_cache:
            widget.configure(image=self._thumbnails_cache[url], text="")
            return
        def worker():
            try:
                import io, requests
                from PIL import Image
                r = requests.get(url, timeout=3)
                if r.status_code == 200:
                    img = Image.open(io.BytesIO(r.content)).resize((36, 36))
                    ctk_img = ctk.CTkImage(light_image=img, dark_image=img, size=(36, 36))
                    self._thumbnails_cache[url] = ctk_img
                    self.after(0, lambda: widget.configure(image=ctk_img, text=""))
            except Exception:
                pass
        threading.Thread(target=worker, daemon=True).start()

    def _cargar_a_deck_dj(self, item):
        self._current_deck_item = item
        self.dock_titulo.configure(text=str(item.get("titulo", ""))[:28])
        self.dock_artista.configure(text=str(item.get("artista", ""))[:28])
        if item.get("cover_url"):
            self._cargar_cover_async(item.get("cover_url"), self.dock_cover)
        self._dibujar_onda_dock()
        self._toggle_dock_play(forzar_play=True)

    def _dibujar_onda_dock(self):
        self.dock_wave_canvas.delete("all")
        w = self.dock_wave_canvas.winfo_width()
        if w < 100:
            w = 420
        h = 36
        mid = h / 2.0
        num_bars = 85
        bw = w / num_bars
        for i in range(num_bars):
            val = 0.2 + 0.55 * (math.sin(i / 5.5) ** 2)
            if 18 <= i <= 34 or 55 <= i <= 72:
                val = min(0.95, val * 1.5)
            alt = val * (mid * 0.9)
            color = "#FF3333" if val > 0.7 else ("#FFAA00" if val > 0.45 else "#00E5FF")
            self.dock_wave_canvas.create_line(i * bw + 1, mid - alt, i * bw + 1, mid + alt, fill=color, width=max(1, bw - 1.5))

    def _toggle_dock_play(self, forzar_play=False):
        if not hasattr(self, "_player"):
            self._player = MacAudioPlayer()
            self._stream_service = AudioStreamService()

        item = getattr(self, "_current_deck_item", None)
        if not item:
            self.log_spotify_dl("[!] Selecciona primero un track pulsando Cargar.")
            return

        # Pausar si está reproduciendo
        if self._player.is_playing and not forzar_play:
            self._player.pause()
            self.btn_dock_play.configure(text="PLAY", fg_color="#00AEEF")
            return

        # Reanudar si ya hay pista cargada pero en pausa
        if not self._player.is_playing and not forzar_play and self._player.current_file:
            self._player.resume()
            self.btn_dock_play.configure(text="PAUSE", fg_color="#FFAA00")
            return

        # Detener anterior y preparar nueva reproducción
        self._player.stop()
        self.btn_dock_play.configure(text="CARGANDO...", fg_color="#333333")

        def worker():
            file_path = self._stream_service.obtener_audio_track(item)
            def on_ready():
                if file_path and self._player.play(file_path):
                    self.btn_dock_play.configure(text="PAUSE", fg_color="#FFAA00")
                    self.log_spotify_dl(f"▶ Reproduciendo en Deck: {item.get('artista', '')} - {item.get('titulo', '')}", "success")
                else:
                    self.btn_dock_play.configure(text="PLAY", fg_color="#00AEEF")
                    self.log_spotify_dl("[!] No se pudo obtener el stream de audio para este track.", "error")
            self.after(0, on_ready)

        threading.Thread(target=worker, daemon=True).start()

    def _stop_dock_play(self):
        if hasattr(self, "_player"):
            self._player.stop()
        self.btn_dock_play.configure(text="PLAY", fg_color="#00AEEF")
