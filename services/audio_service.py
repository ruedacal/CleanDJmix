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

        # Generar variantes normalizadas (NFC y NFD) para compatibilidad con macOS HFS+/APFS
        import unicodedata
        variantes = [identificador]
        try:
            nfc = unicodedata.normalize('NFC', identificador)
            nfd = unicodedata.normalize('NFD', identificador)
            if nfc not in variantes:
                variantes.append(nfc)
            if nfd not in variantes:
                variantes.append(nfd)
        except Exception:
            pass

        # 2. Rutas directas y relativas con cada variante
        for vid in variantes:
            if vid in self._cache_rutas:
                r = self._cache_rutas[vid]
                if os.path.exists(r):
                    return r
            if os.path.isabs(vid) and os.path.exists(vid):
                self._cache_rutas[identificador] = vid
                return vid
            candidato = os.path.join(self.directorio_base, vid)
            if os.path.exists(candidato):
                self._cache_rutas[identificador] = candidato
                return candidato

        # 3. Búsqueda por nombre base en caché
        base_names = [os.path.basename(v) for v in variantes]
        for bn in base_names:
            if bn in self._cache_rutas:
                ruta = self._cache_rutas[bn]
                if os.path.exists(ruta):
                    self._cache_rutas[identificador] = ruta
                    return ruta

        # 4. Escaneo en disco amortizado con normalización NFC/NFD
        target_norm_set = set()
        for bn in base_names:
            target_norm_set.add(unicodedata.normalize('NFC', bn))
            target_norm_set.add(unicodedata.normalize('NFD', bn))

        for root, _, files in os.walk(self.directorio_base):
            for f in files:
                f_nfc = unicodedata.normalize('NFC', f)
                f_nfd = unicodedata.normalize('NFD', f)
                if f in base_names or f_nfc in target_norm_set or f_nfd in target_norm_set:
                    encontrada = os.path.join(root, f)
                    self._cache_rutas[identificador] = encontrada
                    for bn in base_names:
                        self._cache_rutas[bn] = encontrada
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
