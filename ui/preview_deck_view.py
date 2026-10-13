import customtkinter as ctk
from typing import List, Dict, Any, Callable, Optional
from application.player_deck import AudioPlayerDeck

class PreviewDeckView(ctk.CTkFrame):
    """Panel visual interactivo de preescucha y selección para CleanDJmix PRO."""

    def __init__(self, master, player_deck: Optional[AudioPlayerDeck] = None, on_download_selected: Optional[Callable[[List[Dict[str, Any]]], None]] = None, **kwargs):
        super().__init__(master, **kwargs)
        self.deck = player_deck or AudioPlayerDeck()
        self.on_download_selected = on_download_selected
        self.tracks: List[Dict[str, Any]] = []
        self.checkbox_vars: Dict[int, ctk.BooleanVar] = {}
        self.play_buttons: Dict[int, ctk.CTkButton] = {}
        self.current_playing_idx: Optional[int] = None

        # Conectar el callback del deck de audio a la UI (en el hilo de Tkinter)
        self.deck.on_state_change = self._on_deck_state_change

        self._crear_interfaz()

    def _crear_interfaz(self):
        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(0, weight=1)

        # --- HEADER / CONTROLES DE TABLA ---
        self.header_frame = ctk.CTkFrame(self, fg_color="#1A1A1A", corner_radius=6)
        self.header_frame.grid(row=0, column=0, sticky="ew", padx=8, pady=(8, 4))
        self.header_frame.grid_columnconfigure(3, weight=1)

        self.btn_select_all = ctk.CTkButton(
            self.header_frame, text="Marcar todos", width=100, height=28,
            command=self._toggle_select_all, fg_color="#2B2B2B", hover_color="#3A3A3A"
        )
        self.btn_select_all.grid(row=0, column=0, padx=8, pady=6)

        self.lbl_conteo = ctk.CTkLabel(self.header_frame, text="0 pistas cargadas", font=("Arial", 12))
        self.lbl_conteo.grid(row=0, column=1, padx=8, pady=6)

        # --- LISTA SCROLLEABLE DE PISTAS ---
        self.scroll_frame = ctk.CTkScrollableFrame(self, fg_color="#121212", corner_radius=6)
        self.scroll_frame.grid(row=1, column=0, sticky="nsew", padx=8, pady=4)
        self.scroll_frame.grid_columnconfigure(2, weight=1)

        # --- BARRA DE TRANSPORTE MASTER ---
        self.deck_bar = ctk.CTkFrame(self, fg_color="#1E1E1E", height=70, corner_radius=8)
        self.deck_bar.grid(row=2, column=0, sticky="ew", padx=8, pady=(4, 8))
        self.deck_bar.grid_columnconfigure(1, weight=1)

        # Info del track sonando
        self.lbl_deck_info = ctk.CTkLabel(
            self.deck_bar, text="Listo para reproducir", font=("Arial", 13, "bold"),
            anchor="w", text_color="#A0A0A0"
        )
        self.lbl_deck_info.grid(row=0, column=0, columnspan=2, sticky="w", padx=12, pady=(6, 2))

        # Controles de transporte
        self.controls_frame = ctk.CTkFrame(self.deck_bar, fg_color="transparent")
        self.controls_frame.grid(row=1, column=0, sticky="w", padx=12, pady=(0, 6))

        self.btn_prev = ctk.CTkButton(self.controls_frame, text="⏮", width=36, height=30, command=self._prev_track)
        self.btn_prev.pack(side="left", padx=2)

        self.btn_master_play = ctk.CTkButton(self.controls_frame, text="▶", width=42, height=30, command=self._master_toggle_play, fg_color="#1DB954", hover_color="#179B43")
        self.btn_master_play.pack(side="left", padx=2)

        self.btn_next = ctk.CTkButton(self.controls_frame, text="⏭", width=36, height=30, command=self._next_track)
        self.btn_next.pack(side="left", padx=2)

        self.btn_stop = ctk.CTkButton(self.controls_frame, text="⏹", width=36, height=30, command=self._stop_playback, fg_color="#E74C3C", hover_color="#C0392B")
        self.btn_stop.pack(side="left", padx=2)

        # Slider de volumen
        self.vol_slider = ctk.CTkSlider(self.deck_bar, from_=0.0, to=1.0, width=120, height=16, command=self._on_volume_change)
        self.vol_slider.set(1.0)
        self.vol_slider.grid(row=1, column=1, sticky="w", padx=16, pady=(0, 6))

        # Botón de descarga masiva
        self.btn_download = ctk.CTkButton(
            self.deck_bar, text="Descargar Seleccionadas (0)", font=("Arial", 13, "bold"),
            fg_color="#3498DB", hover_color="#2980B9", height=34, command=self._trigger_download
        )
        self.btn_download.grid(row=0, column=2, rowspan=2, padx=12, pady=6)

    def cargar_pistas(self, lista_pistas: List[Dict[str, Any]]):
        """Puebla la lista visual con el resultado del escáner de Spotify."""
        self.tracks = lista_pistas
        self.checkbox_vars.clear()
        self.play_buttons.clear()
        self.current_playing_idx = None

        # Limpiar filas existentes
        for child in self.scroll_frame.winfo_children():
            child.destroy()

        self.lbl_conteo.configure(text=f"{len(self.tracks)} pistas disponibles")

        for idx, track in enumerate(self.tracks):
            row_frame = ctk.CTkFrame(self.scroll_frame, fg_color="#1A1A1A" if idx % 2 == 0 else "#222222", corner_radius=4)
            row_frame.pack(fill="x", pady=2, padx=2)
            row_frame.grid_columnconfigure(2, weight=1)

            # Checkbox
            var = ctk.BooleanVar(value=True)
            self.checkbox_vars[idx] = var
            cb = ctk.CTkCheckBox(row_frame, text="", variable=var, width=24, command=self._update_download_count)
            cb.grid(row=0, column=0, padx=6, pady=4)

            # Botón Play individual
            btn_play = ctk.CTkButton(
                row_frame, text="▶", width=32, height=28,
                fg_color="#333333", hover_color="#1DB954",
                command=lambda i=idx: self._toggle_track_idx(i)
            )
            btn_play.grid(row=0, column=1, padx=4, pady=4)
            self.play_buttons[idx] = btn_play

            # Información del track
            titulo = track.get("titulo", "Sin título")
            artista = track.get("artista", "Desconocido")
            album = track.get("album", "")
            lbl_meta = ctk.CTkLabel(
                row_frame, text=f"{artista} - {titulo}  ({album})",
                font=("Arial", 12), anchor="w"
            )
            lbl_meta.grid(row=0, column=2, sticky="w", padx=6, pady=4)

            # Duración
            lbl_dur = ctk.CTkLabel(row_frame, text=track.get("duracion", "00:00"), font=("Arial", 11), text_color="#888888")
            lbl_dur.grid(row=0, column=3, padx=8, pady=4)

        self._update_download_count()

    def _toggle_select_all(self):
        all_selected = all(v.get() for v in self.checkbox_vars.values()) if self.checkbox_vars else False
        nuevo_estado = not all_selected
        for var in self.checkbox_vars.values():
            var.set(nuevo_estado)
        self.btn_select_all.configure(text="Desmarcar todos" if nuevo_estado else "Marcar todos")
        self._update_download_count()

    def _update_download_count(self):
        seleccionados = sum(1 for v in self.checkbox_vars.values() if v.get())
        self.btn_download.configure(text=f"Descargar Seleccionadas ({seleccionados})")

    def _toggle_track_idx(self, idx: int):
        if idx < 0 or idx >= len(self.tracks):
            return
        track = self.tracks[idx]
        if self.current_playing_idx == idx:
            self.deck.toggle_play_pause(track)
        else:
            self.current_playing_idx = idx
            self.deck.play_track(track)

    def _master_toggle_play(self):
        if self.current_playing_idx is not None and 0 <= self.current_playing_idx < len(self.tracks):
            self.deck.toggle_play_pause(self.tracks[self.current_playing_idx])
        elif self.tracks:
            self._toggle_track_idx(0)

    def _prev_track(self):
        if self.current_playing_idx is not None and self.current_playing_idx > 0:
            self._toggle_track_idx(self.current_playing_idx - 1)

    def _next_track(self):
        if self.current_playing_idx is not None and self.current_playing_idx + 1 < len(self.tracks):
            self._toggle_track_idx(self.current_playing_idx + 1)

    def _stop_playback(self):
        self.deck.stop()
        if self.current_playing_idx is not None and self.current_playing_idx in self.play_buttons:
            self.play_buttons[self.current_playing_idx].configure(text="▶", fg_color="#333333")
        self.btn_master_play.configure(text="▶", fg_color="#1DB954")
        self.lbl_deck_info.configure(text="Reproducción detenida", text_color="#A0A0A0")

    def _on_volume_change(self, val: float):
        self.deck.set_volume(val)

    def _on_deck_state_change(self, estado: str, track: Dict[str, Any]):
        """Sincroniza el estado del audio con los botones e indicadores de la UI."""
        def _update():
            idx = self.current_playing_idx
            art = track.get("artista", "")
            tit = track.get("titulo", "")

            # Reset de otros botones
            for i, btn in self.play_buttons.items():
                if i != idx:
                    btn.configure(text="▶", fg_color="#333333")

            btn_actual = self.play_buttons.get(idx) if idx is not None else None

            if estado == "loading":
                if btn_actual:
                    btn_actual.configure(text="⏳", fg_color="#F39C12")
                self.btn_master_play.configure(text="⏳", fg_color="#F39C12")
                self.lbl_deck_info.configure(text=f"Cargando preescucha: {art} - {tit}...", text_color="#F39C12")

            elif estado == "playing":
                if btn_actual:
                    btn_actual.configure(text="⏸", fg_color="#1DB954")
                self.btn_master_play.configure(text="⏸", fg_color="#E67E22")
                self.lbl_deck_info.configure(text=f"▶ Reproduciendo: {art} - {tit}", text_color="#2ECC71")

            elif estado == "paused":
                if btn_actual:
                    btn_actual.configure(text="▶", fg_color="#E67E22")
                self.btn_master_play.configure(text="▶", fg_color="#1DB954")
                self.lbl_deck_info.configure(text=f"⏸ Pausado: {art} - {tit}", text_color="#E67E22")

            elif estado in ("stopped", "error"):
                if btn_actual:
                    btn_actual.configure(text="▶", fg_color="#333333")
                self.btn_master_play.configure(text="▶", fg_color="#1DB954")
                if estado == "error":
                    self.lbl_deck_info.configure(text=f"Error al obtener audio de: {art} - {tit}", text_color="#E74C3C")
                else:
                    self.lbl_deck_info.configure(text="Listo", text_color="#A0A0A0")

        self.after(0, _update)

    def _trigger_download(self):
        if not self.on_download_selected:
            return
        seleccionadas = [self.tracks[i] for i, v in self.checkbox_vars.items() if v.get()]
        if seleccionadas:
            self.on_download_selected(seleccionadas)
