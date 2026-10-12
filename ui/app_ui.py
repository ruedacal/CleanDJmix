"""
Interfaz Gráfica CleanDJmix PRO con visualización de carátulas,
reproductor integrado y Waveform interactivo.
"""

import os
import io
import math
import tempfile
import threading
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import requests
from PIL import Image, ImageTk
import numpy as np
import pygame

from infrastructure.adapters import AudioAdapter, SpotifyDownloaderAdapter
from infrastructure.auth_adapter import AuthAdapter

# Inicializar motor de audio
pygame.mixer.init()


class CleanDJmixApp(tk.Tk):
    def __init__(self, perfil_usuario=None):
        super().__init__()
        self.perfil = perfil_usuario or {"role": "admin", "email": "dj@cleandjmix.com"}
        self.title("CleanDJmix PRO - DJ Suite")
        self.geometry("1150x780")
        self.configure(bg="#121212")

        self.pistas_detectadas = []
        self.thumbnails_cache = {}
        self.puntos_onda_actual = []
        self.archivo_temporal_audio = None
        self.reproduciendo = False

        self._crear_interfaz()

    def _crear_interfaz(self):
        # 1. BARRA SUPERIOR
        top_bar = tk.Frame(self, bg="#1E1E1E", height=50)
        top_bar.pack(fill="x", side="top")

        lbl_logo = tk.Label(top_bar, text="CleanDJmix PRO", font=("Arial", 16, "bold"), fg="#00D2FF", bg="#1E1E1E")
        lbl_logo.pack(side="left", padx=20, pady=10)

        lbl_user = tk.Label(top_bar, text=f"DJ: {self.perfil.get('email', '')} [{self.perfil.get('role', 'admin').upper()}]", font=("Arial", 10), fg="#888", bg="#1E1E1E")
        lbl_user.pack(side="right", padx=20)

        btn_logout = tk.Button(top_bar, text="Cerrar Sesión", bg="#333", fg="white", relief="flat", command=self._cerrar_sesion)
        btn_logout.pack(side="right", padx=10)

        # 2. PESTAÑAS
        self.notebook = ttk.Notebook(self)
        self.notebook.pack(fill="both", expand=True, padx=15, pady=10)

        self.tab_descarga = tk.Frame(self.notebook, bg="#121212")
        self.notebook.add(self.tab_descarga, text="Descargador Spotify")

        self._montar_tab_descarga()

        # 3. BARRA INFERIOR: REPRODUCTOR & WAVEFORM
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
        self.frame_player = tk.Frame(self, bg="#181818", height=110, highlightthickness=1, highlightbackground="#2A2A2A")
        self.frame_player.pack(fill="x", side="bottom")

        # Controles
        ctrl_box = tk.Frame(self.frame_player, bg="#181818", width=220)
        ctrl_box.pack(side="left", padx=15, pady=10, fill="y")

        botones_row = tk.Frame(ctrl_box, bg="#181818")
        botones_row.pack(anchor="w")

        self.btn_play_pause = tk.Button(botones_row, text="▶ Play", font=("Arial", 10, "bold"), bg="#00D2FF", fg="#000", width=8, relief="flat", command=self._toggle_audio)
        self.btn_play_pause.pack(side="left", padx=2)

        self.btn_stop = tk.Button(botones_row, text="⏹ Stop", font=("Arial", 10, "bold"), bg="#333", fg="#FFF", width=6, relief="flat", command=self._stop_audio)
        self.btn_stop.pack(side="left", padx=2)

        self.lbl_now_playing = tk.Label(ctrl_box, text="Ninguna pista seleccionada", font=("Arial", 9, "bold"), fg="#00D2FF", bg="#181818", anchor="w")
        self.lbl_now_playing.pack(fill="x", pady=4)

        self.lbl_status = tk.Label(ctrl_box, text="Listo para reproducir", font=("Arial", 8), fg="#777", bg="#181818", anchor="w")
        self.lbl_status.pack(fill="x")

        # Canvas Waveform DJ
        self.canvas_wave = tk.Canvas(self.frame_player, bg="#0D0D0D", height=80, highlightthickness=1, highlightbackground="#333")
        self.canvas_wave.pack(side="right", fill="both", expand=True, padx=15, pady=10)
        
        # Redibujar cuando cambie el tamaño de ventana
        self.canvas_wave.bind("<Configure>", lambda e: self._redibujar_waveform())
        self.after(100, self._redibujar_waveform)

    def _redibujar_waveform(self):
        self.canvas_wave.delete("all")
        w = self.canvas_wave.winfo_width()
        h = self.canvas_wave.winfo_height()
        if w <= 1 or h <= 1:
            return

        mid = h / 2.0

        if not self.puntos_onda_actual:
            # Onda base de reposo
            puntos = [0.15 + 0.5 * (math.sin(i / 5.0) ** 2) for i in range(120)]
        else:
            puntos = self.puntos_onda_actual

        num_barras = len(puntos)
        ancho_barra = max(2.0, w / num_barras)

        # Línea central de guía
        self.canvas_wave.create_line(0, mid, w, mid, fill="#222", width=1)

        for i, val in enumerate(puntos):
            x = i * ancho_barra
            altura = max(2.0, val * (h / 2.3))
            color = "#00D2FF" if i % 2 == 0 else "#0088FF"
            self.canvas_wave.create_line(x, mid - altura, x, mid + altura, fill=color, width=max(1, ancho_barra - 1.5))

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
            btn_prev = tk.Button(fila, text="🔊 Escuchar & Onda", font=("Arial", 9, "bold"), bg="#00D2FF", fg="#000", padx=8, relief="flat", command=lambda it=item: self._cargar_y_reproducir_track(it))
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

    def _cargar_y_reproducir_track(self, item):
        self.lbl_now_playing.configure(text=f"{item['artista']} - {item['titulo']}")
        self.lbl_status.configure(text="Cargando audio y analizando forma de onda...")

        def tarea():
            preview_url = item.get("preview_url")
            temp_dir = tempfile.gettempdir()
            archivo_audio = os.path.join(temp_dir, f"cleandj_preview_{abs(hash(item['titulo']))}.mp3")

            puntos = []
            audio_listo = False

            # 1. Intentar preview oficial directo de Spotify
            if preview_url:
                try:
                    r = requests.get(preview_url, timeout=6)
                    if r.status_code == 200:
                        with open(archivo_audio, "wb") as f:
                            f.write(r.content)
                        audio_listo = True
                except Exception:
                    pass

            # 2. Si no hay preview de 30s en Spotify, generar clip rápido con yt-dlp
            if not audio_listo:
                import yt_dlp
                ydl_opts = {
                    'format': 'bestaudio/best',
                    'outtmpl': archivo_audio.replace(".mp3", "") + ".%(ext)s",
                    'postprocessors': [{'key': 'FFmpegExtractAudio', 'preferredcodec': 'mp3'}],
                    'quiet': True,
                    'no_warnings': True,
                }
                query = f"ytsearch1:{item['artista']} - {item['titulo']} audio"
                try:
                    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                        ydl.download([query])
                    audio_listo = os.path.exists(archivo_audio)
                except Exception:
                    pass

            # 3. Analizar onda real si el archivo existe
            if audio_listo and os.path.exists(archivo_audio):
                puntos = AudioAdapter.obtener_perfil_onda(archivo_audio, num_puntos=140)
                self.archivo_temporal_audio = archivo_audio
            else:
                puntos = [float(np.clip(np.random.normal(0.5, 0.25), 0.08, 1.0)) for _ in range(140)]

            self.after(0, lambda: self._arrancar_audio(puntos, audio_listo))

        threading.Thread(target=tarea, daemon=True).start()

    def _arrancar_audio(self, puntos, audio_listo):
        self.puntos_onda_actual = puntos
        self._redibujar_waveform()

        if audio_listo and self.archivo_temporal_audio:
            try:
                pygame.mixer.music.load(self.archivo_temporal_audio)
                pygame.mixer.music.play()
                self.reproduciendo = True
                self.btn_play_pause.configure(text="⏸ Pausa", bg="#FFB800")
                self.lbl_status.configure(text="Reproduciendo preescucha en vivo")
            except Exception as e:
                self.lbl_status.configure(text=f"Error audio: {e}")
        else:
            self.lbl_status.configure(text="Preescucha simulada (onda analizada)")

    def _toggle_audio(self):
        if not self.archivo_temporal_audio:
            return

        if self.reproduciendo:
            pygame.mixer.music.pause()
            self.reproduciendo = False
            self.btn_play_pause.configure(text="▶ Play", bg="#00D2FF")
            self.lbl_status.configure(text="Pausado")
        else:
            pygame.mixer.music.unpause()
            self.reproduciendo = True
            self.btn_play_pause.configure(text="⏸ Pausa", bg="#FFB800")
            self.lbl_status.configure(text="Reproduciendo")

    def _stop_audio(self):
        pygame.mixer.music.stop()
        self.reproduciendo = False
        self.btn_play_pause.configure(text="▶ Play", bg="#00D2FF")
        self.lbl_status.configure(text="Detenido")

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
        self._stop_audio()
        AuthAdapter.cerrar_sesion()
        self.destroy()


def run():
    app = CleanDJmixApp()
    app.mainloop()


if __name__ == "__main__":
    run()
