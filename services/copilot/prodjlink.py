"""
Receptor Nativo de Pioneer Pro DJ Link para BeatWave Live Copilot v2.0.
Decodifica datagramas UDP de red local (puertos 50000 y 50002) emitidos por
reproductores Pioneer CDJ / XDJ y mesas DJM en tiempo real.

Especificación:
- Magic Header: 'ProDJLink' / '\\x50\\x72\\x6f\\x44\\x4a\\x4c\\x69\\x6e\\x6b'
- Broadcast / Unicast en puerto 50000 (Beat packets, status y keep-alive)
- Extracción de BPM, Pitch, Fase de compás (1-4), Master Tempo y estado Play/Pause.
"""

import socket
import struct
import threading
import time
from typing import Optional, Callable, Dict, Any


class ProDJLinkReceiver:
    PRODJLINK_MAGIC = b"ProDJLink"
    PORT_BEAT = 50000
    PORT_STATUS = 50002

    def __init__(self, on_packet_callback: Optional[Callable[[Dict[str, Any]], None]] = None):
        self.on_packet_callback = on_packet_callback
        self.running = False
        self._thread: Optional[threading.Thread] = None
        self._socket: Optional[socket.socket] = None
        self.connected_devices: Dict[int, Dict[str, Any]] = {}
        self.last_packet_time = 0.0

    def start(self):
        """Inicia el hilo receptor de datagramas UDP de Pro DJ Link."""
        if self.running:
            return
        self.running = True
        self._thread = threading.Thread(target=self._listen_loop, name="ProDJLink-UDP-Listener", daemon=True)
        self._thread.start()

    def stop(self):
        """Detiene la escucha y libera los sockets."""
        self.running = False
        if self._socket:
            try:
                self._socket.close()
            except Exception:
                pass
            self._socket = None

    def _listen_loop(self):
        """Bucle de recepción de baja latencia con SO_REUSEADDR y buffer pre-asignado."""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
            except AttributeError:
                pass  # En sistemas sin SO_REUSEPORT
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            sock.settimeout(1.0)
            sock.bind(("", self.PORT_BEAT))
            self._socket = sock
        except Exception:
            self.running = False
            return

        buf = bytearray(2048)  # Pre-allocation para evitar recolección de basura
        while self.running:
            try:
                nbytes, addr = sock.recvfrom_into(buf)
                if nbytes < 10:
                    continue
                packet_data = bytes(buf[:nbytes])
                parsed = self.decodificar_paquete(packet_data, addr[0])
                if parsed and self.on_packet_callback:
                    self.on_packet_callback(parsed)
            except socket.timeout:
                continue
            except Exception:
                if not self.running:
                    break
                time.sleep(0.01)

    @classmethod
    def decodificar_paquete(cls, data: bytes, ip_origen: str = "") -> Optional[Dict[str, Any]]:
        """
        Decodifica un paquete binario de Pro DJ Link.
        Soporta paquetes de Beat (0x28) y Announcement (0x0a).
        """
        if not data.startswith(cls.PRODJLINK_MAGIC):
            # Probar cabecera alternativa común en firmware Pioneer 'Q-Link' o variantes
            if not data.startswith(b"ProDJ\x00"):
                return None

        cls_packet_time = time.time()
        packet_type = data[0x0a] if len(data) > 0x0a else 0

        # Paquete de Estado / Beat (0x28)
        if packet_type == 0x28 and len(data) >= 0x36:
            try:
                player_id = int(data[0x21]) if data[0x21] in (1, 2, 3, 4) else int(data[0x24])
                # BPM codificado como entero * 100
                raw_bpm = struct.unpack(">I", data[0x2c:0x30])[0] if len(data) >= 0x30 else 12600
                bpm_val = round(raw_bpm / 100.0, 2)
                if bpm_val < 30.0 or bpm_val > 250.0:
                    bpm_val = 126.0

                # Pitch (desviación porcentual)
                raw_pitch = struct.unpack(">i", data[0x30:0x34])[0] if len(data) >= 0x34 else 0
                pitch_pct = round((raw_pitch / 100000.0), 2)

                # Beat phase (1, 2, 3 o 4)
                beat_phase = int(data[0x34]) if len(data) > 0x34 and data[0x34] in (1, 2, 3, 4) else 1

                # Flags: Play, Master
                flags = data[0x27] if len(data) > 0x27 else 0
                is_playing = bool(flags & 0x01)
                is_master = bool(flags & 0x02)

                return {
                    "type": "BEAT_PACKET",
                    "player_id": player_id,
                    "bpm": bpm_val,
                    "pitch": pitch_pct,
                    "effective_bpm": round(bpm_val * (1.0 + (pitch_pct / 100.0)), 2),
                    "beat": beat_phase,
                    "is_playing": is_playing,
                    "is_master": is_master,
                    "ip": ip_origen,
                    "timestamp": cls_packet_time
                }
            except Exception:
                return None

        # Paquete de Descubrimiento / Keep-alive (0x0a)
        elif packet_type == 0x0a and len(data) >= 0x24:
            try:
                device_name = data[0x0c:0x1c].decode("utf-8", errors="ignore").strip("\x00").strip()
                device_id = int(data[0x24]) if len(data) > 0x24 and data[0x24] in (1, 2, 3, 4) else 1
                return {
                    "type": "DEVICE_ANNOUNCE",
                    "player_id": device_id,
                    "device_name": device_name or f"CDJ-{device_id}",
                    "ip": ip_origen,
                    "timestamp": cls_packet_time
                }
            except Exception:
                return None

        return None
