import os
import subprocess
import threading

class AudioPlaybackService:
    def __init__(self):
        self.proceso_actual = None
        self.directorio_base = "/Users/admin/Music/mi musica"
        self.pista_actual = ""
        self._lock = threading.Lock()

    def establecer_directorio(self, ruta: str):
        if ruta and os.path.isdir(ruta):
            self.directorio_base = ruta

    def _resolver_ruta(self, identificador: str) -> str:
        if not identificador:
            return ""
        if os.path.isabs(identificador) and os.path.exists(identificador):
            return identificador
        candidato = os.path.join(self.directorio_base, identificador)
        if os.path.exists(candidato):
            return candidato
        for root, _, files in os.walk(self.directorio_base):
            if os.path.basename(identificador) in files:
                return os.path.join(root, os.path.basename(identificador))
        return ""

    def reproducir_mac(self, nombre_o_ruta: str):
        with self._lock:
            self._detener_interno()
            ruta_real = self._resolver_ruta(nombre_o_ruta)
            if not ruta_real:
                print(f"[AUDIO SERVICE] Archivo no encontrado para reproducir: {nombre_o_ruta}")
                return {"status": "error", "msg": "Archivo no encontrado"}
            try:
                self.pista_actual = ruta_real
                self.proceso_actual = subprocess.Popen(
                    ["afplay", ruta_real],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
                print(f"[AUDIO SERVICE] ▶ Reproduciendo: {os.path.basename(ruta_real)}")
                return {"status": "playing", "path": ruta_real}
            except Exception as e:
                print(f"[AUDIO SERVICE ERROR] {e}")
                return {"status": "error", "msg": str(e)}

    def _detener_interno(self):
        if self.proceso_actual and self.proceso_actual.poll() is None:
            try:
                self.proceso_actual.terminate()
                self.proceso_actual.wait(timeout=1)
            except Exception:
                try:
                    self.proceso_actual.kill()
                except Exception:
                    pass
        self.proceso_actual = None
        subprocess.run(["killall", "afplay"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    def detener_mac(self):
        with self._lock:
            self._detener_interno()
            print("[AUDIO SERVICE] ⏹ Audio detenido.")
            return {"status": "stopped"}

    def cue_mac(self, nombre_o_ruta: str = ""):
        with self._lock:
            self._detener_interno()
            if nombre_o_ruta:
                self.pista_actual = self._resolver_ruta(nombre_o_ruta)
            print(f"[AUDIO SERVICE] ⏮ CUE armado en 00:00.000: {os.path.basename(self.pista_actual) if self.pista_actual else 'Ready'}")
            return {"status": "cued", "path": self.pista_actual}
