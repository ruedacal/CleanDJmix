import os
import subprocess
import threading

class AudioPlaybackService:
    def __init__(self):
        self.proceso_actual = None
        self.directorio_base = "/Users/admin/Music/mi musica"
        self.pista_actual = ""
        self._lock = threading.Lock()
        self._cache_rutas = {}

    def establecer_directorio(self, ruta: str):
        if ruta and os.path.isdir(ruta):
            self.directorio_base = ruta
            self._cache_rutas.clear()

    def _resolver_ruta(self, identificador: str) -> str:
        if not identificador:
            return ""
        
        # 1. Búsqueda instantánea en caché en memoria
        if identificador in self._cache_rutas:
            ruta = self._cache_rutas[identificador]
            if os.path.exists(ruta):
                return ruta

        # 2. Ruta absoluta directa
        if os.path.isabs(identificador) and os.path.exists(identificador):
            self._cache_rutas[identificador] = identificador
            return identificador

        # 3. Concatenación con directorio base
        candidato = os.path.join(self.directorio_base, identificador)
        if os.path.exists(candidato):
            self._cache_rutas[identificador] = candidato
            return candidato

        # 4. Búsqueda por nombre base en caché
        base_name = os.path.basename(identificador)
        if base_name in self._cache_rutas:
            ruta = self._cache_rutas[base_name]
            if os.path.exists(ruta):
                self._cache_rutas[identificador] = ruta
                return ruta

        # 5. Escaneo en disco amortizado (se almacena de inmediato en caché)
        for root, _, files in os.walk(self.directorio_base):
            if base_name in files:
                encontrada = os.path.join(root, base_name)
                self._cache_rutas[identificador] = encontrada
                self._cache_rutas[base_name] = encontrada
                return encontrada
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
