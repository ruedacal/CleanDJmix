"""
Interfaz Gráfica CleanDJmix PRO con visualización de carátulas,
reproducción de preescucha y waveform interactivo.
"""

import os
import io
import threading
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import requests
from PIL import Image, ImageTk
import pygame

from infrastructure.adapters import AudioAdapter, SpotifyDownloaderAdapter
from infrastructure.auth_adapter import AuthAdapter

pygame.mixer.init()


class CleanDJmixApp(tk.Tk):
    def __init__(self, perfil_usuario=None):
        super().__init__()
        self.perfil = perfil_usuario or {"role": "admin", "email": "dj@cleandjmix.com"}
        self.title("CleanDJmix PRO - DJ Suite")
        self.geometry("1100x750")
        self.configure(bg="#121212")

        self.pistas_detectadas = []
        self.thumbnails_cache = {}
        self.track_reproduciendo = None

        self._crear_interfaz()

    def _crear_interfaz(self):
        # Barra Superior
        top_bar = tk.Frame(self, bg="#1E1E1E", height=50)
        top_bar.pack(fill="x", side="top")

        lbl_logo = tk.Label(top_bar, text="CleanDJmix PRO", font=("Arial", 16, "bold"), fg="#00D2FF", bg="#1E1E1E")
        lbl_logo.pack(side="left", padx=20, pady=10)

        lbl_user = tk.Label(top_bar, text=f"DJ: {self.perfil.get('email', '')} [{self.perfil.get('role', 'admin').upper()}]", font=("Arial", 10), fg="#888", bg="#1E1E1E")
        lbl_user.pack(side="right", padx=20)

        btn_logout = tk.Button(top_bar, text="Cerrar Sesión", bg="#333", fg="white", relief="flat", command=self._cerrar_sesion)
        btn_logout.pack(side="right", padx=10)

        # Contenedor de Pestañas
        self.notebook = ttk.Notebook(self)
        self.notebook.pack(fill="both", expand=True, padx=15, pady=10)

        self.tab_descarga = tk.Frame(self.notebook, bg="#121212")
        self.notebook.add(self.tab_descarga, text="Descargador Spotify")

        self._montar_tab_descarga()

        # Barra Inferior: Reproductor & Waveform
        self._montar_reproductor_inferior()

    def _montar_tab_descarga(self):
        frame_input = tk.Frame(self.tab_descarga, bg="#181818", pady=10, padx=10)
        frame_input.pack(fill="x", pady=5)

        tk.Label(frame_input, text="URL Spotify (Canción, Álbum, Playlist o Artista):", font=("Arial", 10, "bold"), fg="#DDD", bg="#181818").pack(anchor="w")

        self.entry_url = tk.Entry(frame_input, font=("Arial", 11), bg="#282828", fg="white", insertbackground="white")
        self.entry_url.pack(fill="x", pady=5)

        btn_box = tk.Frame(frame_input, bg="#181818")
        btn_box.pack(fill="x", pady=5)

        btn_escanear = tk.Button(btn_box, text="1. Cargar Lista & Carátulas", font=("Arial", 10, "bold"), bg="#00D2FF", fg="#000", padx=15, pady=5, relief="flat", command=self._accion_escanear)
        btn_escanear.pack(side="left", padx=5)

        btn_descargar = tk.Button(btn_box, text="2. Descargar Seleccionadas (320kbps)", font=("Arial", 10, "bold"), bg="#1DB954", fg="#000", padx=15, pady=5, relief="flat", command=self._accion_descargar)
        btn_descargar.pack(side="left", padx=5)

        # Contenedor Listado con Scroll
        self.canvas_list = tk.Canvas(self.tab_descarga, bg="#181818", highlightthickness=0)
        self.scrollbar = tk.Scrollbar(self.tab_descarga, orient="vertical", command=self.canvas_list.yview)
        self.scroll_frame = tk.Frame(self.canvas_list, bg="#181818")

        self.scroll_frame.bind("<Configure>", lambda e: self.canvas_list.configure(scrollregion=self.canvas_list.bbox("all")))
        self.canvas_list.create_window((0, 0), window=self.scroll_frame, anchor="nw")
        self.canvas_list.configure(yscrollcommand=self.scrollbar.set)

        self.canvas_list.pack(side="left", fill="both", expand=True, pady=5)
        self.scrollbar.pack(side="right", fill="y", pady=5)

    def _montar_reproductor_inferior(self):
        self.frame_player = tk.Frame(self, bg="#1A1A1A", height=110)
        self.frame_player.pack(fill="x", side="bottom")

        # Controles de reproducción
        ctrl_box = tk.Frame(self.frame_player, bg="#1A1A1A")
        ctrl_box.pack(side="left", padx=15, pady=10)

        self.btn_play_pause = tk.Button(ctrl_box, text="▶ Play", font=("Arial", 11, "bold"), bg="#00D2FF", fg="#000", width=8, relief="flat", command=self._toggle_audio)
        self.btn_play_pause.pack(pady=5)

        self.lbl_now_playing = tk.Label(ctrl_box, text="Ninguna pista seleccionada", font=("Arial", 9), fg="#AAA", bg="#1A1A1A")
        self.lbl_now_playing.pack()

        # Canvas Waveform
        self.canvas_wave = tk.Canvas(self.frame_player, bg="#111111", height=70, highlightthickness=1, highlightbackground="#333")
        self.canvas_wave.pack(side="right", fill="both", expand=True, padx=15, pady=10)
        self._dibujar_waveform_demo()

    def _dibujar_waveform_demo(self, puntos=None):
        self.canvas_wave.delete("all")
        w = self.canvas_wave.winfo_width() or 600
        h = self.canvas_wave.winfo_height() or 70
        mid = h / 2

        if not puntos:
            puntos = [0.1 + 0.5 * (np.sin(i / 6.0) ** 2) for i in range(120)]

        ancho_barra = max(2, w / len(puntos))
        for i, val in enumerate(puntos):
            x = i * ancho_barra
            altura = val * (h / 2.2)
            self.canvas_wave.create_line(x, mid - altura, x, mid + altura, fill="#00D2FF", width=ancho_barra - 1)

    def _accion_escanear(self):
        url = self.entry_url.get().strip()
        if not url:
            messagebox.showwarning("Atención", "Pega una URL de Spotify primero.")
            return

        def tarea():
            items = SpotifyDownloaderAdapter.escanear_lista(url)
            self.after(0, lambda: self._mostrar_items(items))

        threading.Thread(target=tarea, daemon=True).start()

    def _mostrar_items(self, items):
        self.pistas_detectadas = items
        for widget in self.scroll_frame.winfo_children():
            widget.destroy()

        self.check_vars = []
        for idx, item in enumerate(items):
            var = tk.BooleanVar(value=True)
            self.check_vars.append(var)

            fila = tk.Frame(self.scroll_frame, bg="#222222", pady=5, padx=8)
            fila.pack(fill="x", expand=True, pady=2, padx=5)

            chk = tk.Checkbutton(fila, variable=var, bg="#222222", selectcolor="#111", activebackground="#222")
            chk.pack(side="left")

            # Thumbnail de portada
            lbl_cover = tk.Label(fila, bg="#333", width=48, height=48)
            lbl_cover.pack(side="left", padx=8)
            self._cargar_thumbnail_async(item.get("cover_url"), lbl_cover)

            # Info de la pista
            info_frame = tk.Frame(fila, bg="#222222")
            info_frame.pack(side="left", fill="x", expand=True, padx=5)

            tk.Label(info_frame, text=f"{item['titulo']}", font=("Arial", 10, "bold"), fg="white", bg="#222222", anchor="w").pack(fill="x")
            tk.Label(info_frame, text=f"{item['artista']} • {item.get('album', '')} ({item.get('duracion', '')})", font=("Arial", 9), fg="#999", bg="#222222", anchor="w").pack(fill="x")

            # Botón de Preescucha / Onda
            btn_prev = tk.Button(fila, text="🔊 Escuchar", font=("Arial", 9), bg="#333", fg="#00D2FF", relief="flat", command=lambda it=item: self._cargar_track_en_reproductor(it))
            btn_prev.pack(side="right", padx=10)

    def _cargar_thumbnail_async(self, url, label_widget):
        if not url:
            return

        def descargar():
            try:
                resp = requests.get(url, timeout=4)
                if resp.status_code == 200:
                    img = Image.open(io.BytesIO(resp.content)).resize((48, 48), Image.Resampling.LANCZOS)
                    tk_img = ImageTk.PhotoImage(img)
                    self.thumbnails_cache[url] = tk_img
                    self.after(0, lambda: label_widget.configure(image=tk_img, width=48, height=48))
            except Exception:
                pass

        threading.Thread(target=descargar, daemon=True).start()

    def _cargar_track_en_reproductor(self, item):
        self.lbl_now_playing.configure(text=f"{item['artista']} - {item['titulo']}")
        # Simular / cargar visualización de onda
        puntos = [float(np.clip(np.random.normal(0.5, 0.25), 0.05, 1.0)) for _ in range(120)]
        self._dibujar_waveform_demo(puntos)

    def _toggle_audio(self):
        if pygame.mixer.music.get_busy():
            pygame.mixer.music.pause()
            self.btn_play_pause.configure(text="▶ Play")
        else:
            pygame.mixer.music.unpause()
            self.btn_play_pause.configure(text="⏸ Pausa")

    def _accion_descargar(self):
        seleccionadas = [
            self.pistas_detectadas[i]
            for i, var in enumerate(self.check_vars)
            if var.get()
        ]
        if not seleccionadas:
            messagebox.showinfo("Descarga", "No has marcado ninguna pista.")
            return

        carpeta = filedialog.askdirectory(title="Carpeta de destino para MP3")
        if not carpeta:
            return

        def hilo_descarga():
            SpotifyDownloaderAdapter.descargar_canciones_seleccionadas(seleccionadas, carpeta)
            messagebox.showinfo("CleanDJmix PRO", f"¡Descarga completada en {carpeta}!")

        threading.Thread(target=hilo_descarga, daemon=True).start()

    def _cerrar_sesion(self):
        AuthAdapter.cerrar_sesion()
        self.destroy()


def run():
    app = CleanDJmixApp()
    app.mainloop()


if __name__ == "__main__":
    run()
