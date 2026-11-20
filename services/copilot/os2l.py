"""
Receptor de Protocolo OS2L (Open Sound to Light) para BeatWave Live Copilot v2.0.
Escucha eventos de mezcla en tiempo real vía TCP (JSON sobre socket) transmitidos
por VirtualDJ Pro, Rekordbox y software de iluminación compatible.

Eventos procesados:
- 'beat': Pulso rítmico, tempo BPM y compás activo.
- 'track': Carga de metadatos (deck, título, artista, BPM, tono Camelot).
- 'play' / 'pause': Estado de transporte en directo.
- 'fader': Posición de volumen y crossfader para análisis Anti-Muddy.
"""

import socket
import json
import threading
import time
from typing import Optional, Callable, Dict, Any


class OS2LReceiver:
    DEFAULT_PORT = 8010

    def __init__(self, port: int = DEFAULT_PORT, on_event_callback: Optional[Callable[[Dict[str, Any]], None]] = None):
        self.port = port
        self.on_event_callback = on_event_callback
        self.running = False
        self._server_socket: Optional[socket.socket] = None
        self._thread: Optional[threading.Thread] = None
        self.clients = []
        self.last_event_time = 0.0

    def start(self):
        """Inicia el servidor TCP receptor de eventos OS2L."""
        if self.running:
            return
        self.running = True
        self._thread = threading.Thread(target=self._server_loop, name="OS2L-TCP-Server", daemon=True)
        self._thread.start()

    def stop(self):
        """Detiene el servidor y cierra las conexiones abiertas."""
        self.running = False
        if self._server_socket:
            try:
                self._server_socket.close()
            except Exception:
                pass
            self._server_socket = None

    def _server_loop(self):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            sock.bind(("0.0.0.0", self.port))
            sock.listen(5)
            sock.settimeout(1.0)
            self._server_socket = sock
        except Exception:
            self.running = False
            return

        while self.running:
            try:
                client_sock, client_addr = sock.accept()
                t = threading.Thread(
                    target=self._client_handler,
                    args=(client_sock, client_addr),
                    name=f"OS2L-Client-{client_addr[0]}",
                    daemon=True
                )
                t.start()
            except socket.timeout:
                continue
            except Exception:
                if not self.running:
                    break
                time.sleep(0.02)

    def _client_handler(self, client_sock: socket.socket, addr):
        client_sock.settimeout(2.0)
        buffer = ""
        while self.running:
            try:
                data = client_sock.recv(2048)
                if not data:
                    break
                buffer += data.decode("utf-8", errors="ignore")
                while "\n" in buffer:
                    line, buffer = buffer.split("\n", 1)
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        evt = json.loads(line)
                        if self.on_event_callback:
                            self.on_event_callback(evt)
                    except json.JSONDecodeError:
                        pass
            except socket.timeout:
                continue
            except Exception:
                break
        try:
            client_sock.close()
        except Exception:
            pass
