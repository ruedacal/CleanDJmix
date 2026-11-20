"""
Extractor DSP Clean-Room de Waveforms Rekordbox 3Band HD (400 cols/s, Offline & Zero-Cost).
Aplica filtrado multibanda real en dominio temporal vía Overlap-Add FFT (sin ringing)
en 3 bandas (Low <250Hz, Mid 250-2500Hz, High >2500Hz) y extrae envolventes de picos
reales cada ~2.5 ms para ofrecer transitorios afilados incluso a zoom 16x.
"""

from __future__ import annotations

import base64
import hashlib
import json
import os
import shutil
import subprocess
import threading
import time
from collections import OrderedDict
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import numpy as np


DEFAULT_COLUMNS_PER_SEC: int = 400
MAX_TOTAL_COLUMNS: int = 144000  # Hasta 6 min a 400 cols/s (escala limpio en pistas largas)
OVERVIEW_COLUMNS: int = 1200     # Alta definición Retina para el minimapa completo
CACHE_VERSION: str = "rb3b_v2_hd"
CACHE_DIR: Path = Path.home() / ".beatwave_cache" / "waveforms_3band"


class Waveform3BandExtractor:
    """Motor vectorizado HD de extracción 3Band (Azul/Ámbar/Blanco) no bloqueante."""

    def __init__(self, max_memory_entries: int = 16) -> None:
        self._max_memory_entries = max_memory_entries
        self._mem_cache: "OrderedDict[str, Dict[str, Any]]" = OrderedDict()
        self._in_flight: Dict[str, threading.Event] = {}
        self._lock = threading.RLock()
        try:
            CACHE_DIR.mkdir(parents=True, exist_ok=True)
        except Exception:
            pass

    @staticmethod
    def _build_cache_key(filepath: str) -> Optional[str]:
        if not filepath or not os.path.isfile(filepath):
            return None
        try:
            st = os.stat(filepath)
            raw = f"{CACHE_VERSION}|{os.path.abspath(filepath)}|{st.st_size}|{st.st_mtime_ns}"
            return hashlib.sha1(raw.encode("utf-8", errors="ignore")).hexdigest()
        except Exception:
            return None

    @staticmethod
    def _decode_audio_mono(filepath: str) -> Tuple[np.ndarray, int, float]:
        """Decodifica audio local a float32 mono ~22.05/24 kHz usando soundfile o ffmpeg."""
        try:
            import soundfile as sf  # type: ignore

            data, sr = sf.read(filepath, dtype="float32", always_2d=True)
            if data.size == 0 or sr <= 0:
                raise ValueError("Archivo de audio vacío")
            duration_sec = float(data.shape[0]) / float(sr)
            mono = data.mean(axis=1, dtype=np.float32) if data.shape[1] > 1 else data[:, 0]

            if sr >= 44100:
                decim = max(1, sr // 22050)
                if decim > 1:
                    trim = (mono.shape[0] // decim) * decim
                    mono = mono[:trim].reshape(-1, decim).mean(axis=1, dtype=np.float32)
                    sr = int(round(sr / decim))
            return mono, sr, duration_sec
        except Exception:
            pass

        ffmpeg_bin = shutil.which("ffmpeg")
        if not ffmpeg_bin:
            raise RuntimeError("No se pudo decodificar con soundfile y ffmpeg no está en PATH.")

        target_sr = 22050
        cmd = [
            ffmpeg_bin,
            "-v", "error",
            "-i", filepath,
            "-vn",
            "-ac", "1",
            "-ar", str(target_sr),
            "-f", "f32le",
            "pipe:1",
        ]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
        if proc.returncode != 0 or not proc.stdout:
            err = proc.stderr.decode("utf-8", errors="ignore").strip()
            raise RuntimeError(f"Error decodificando con ffmpeg: {err or 'sin datos'}")

        mono = np.frombuffer(proc.stdout, dtype=np.float32).copy()
        duration_sec = float(mono.shape[0]) / float(target_sr)
        return mono, target_sr, duration_sec

    @staticmethod
    def _split_3band_time_domain(
        mono: np.ndarray,
        sr: int,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Divide la señal en 3 señales temporales reales (Low/Mid/High) vía OLA-FFT COLA."""
        total_samples = int(mono.shape[0])
        block_size = 32768
        hop = block_size // 2

        # Ventana Hann periódica exacta: w[n] + w[n + hop] == 1.0 (reconstrucción unitaria)
        n = np.arange(block_size, dtype=np.float32)
        window = (0.5 - 0.5 * np.cos((2.0 * np.pi * n) / float(block_size))).astype(np.float32)

        freqs = np.fft.rfftfreq(block_size, d=1.0 / float(sr)).astype(np.float32)

        # Crossovers coseno suaves (evitan pre-ringing y conservan la nitidez del transitorio)
        low_mask = np.ones_like(freqs, dtype=np.float32)
        low_mask[freqs >= 300.0] = 0.0
        low_tr = (freqs > 170.0) & (freqs < 300.0)
        low_mask[low_tr] = 0.5 * (1.0 + np.cos(np.pi * (freqs[low_tr] - 170.0) / 130.0))
        low_mask[freqs < 20.0] = 0.0

        high_mask = np.zeros_like(freqs, dtype=np.float32)
        high_mask[freqs >= 3200.0] = 1.0
        high_tr = (freqs > 2000.0) & (freqs < 3200.0)
        high_mask[high_tr] = 0.5 * (1.0 - np.cos(np.pi * (freqs[high_tr] - 2000.0) / 1200.0))

        mid_mask = np.clip(1.0 - low_mask - high_mask, 0.0, 1.0)
        mid_mask[freqs < 20.0] = 0.0

        # Padding exacto para cubrir inicio y fin con ganancia unitaria
        rem = (total_samples + hop) % hop
        pad_tail = hop + ((hop - rem) % hop)
        padded = np.pad(mono, (hop, pad_tail), mode="constant")
        padded_len = int(padded.shape[0])

        out_low = np.zeros(padded_len, dtype=np.float32)
        out_mid = np.zeros(padded_len, dtype=np.float32)
        out_high = np.zeros(padded_len, dtype=np.float32)

        for start in range(0, padded_len - block_size + 1, hop):
            frame = padded[start : start + block_size] * window
            spec = np.fft.rfft(frame)
            out_low[start : start + block_size] += np.fft.irfft(spec * low_mask, n=block_size).astype(np.float32)
            out_mid[start : start + block_size] += np.fft.irfft(spec * mid_mask, n=block_size).astype(np.float32)
            out_high[start : start + block_size] += np.fft.irfft(spec * high_mask, n=block_size).astype(np.float32)

        sl = slice(hop, hop + total_samples)
        return out_low[sl], out_mid[sl], out_high[sl]

    @classmethod
    def _compute_3band_arrays(
        cls,
        mono: np.ndarray,
        sr: int,
        duration_sec: float,
    ) -> Tuple[np.ndarray, np.ndarray, float]:
        """Calcula envolventes de picos reales 3Band uint8 [N, 3] a 400 cols/s y overview 1200."""
        total_samples = int(mono.shape[0])
        if total_samples < 512 or duration_sec <= 0.0:
            empty = np.zeros((1, 3), dtype=np.uint8)
            return empty, np.zeros((OVERVIEW_COLUMNS, 3), dtype=np.uint8), float(DEFAULT_COLUMNS_PER_SEC)

        target_cols = max(1, int(round(duration_sec * DEFAULT_COLUMNS_PER_SEC)))
        target_cols = min(target_cols, MAX_TOTAL_COLUMNS, total_samples)
        actual_cps = float(target_cols) / float(duration_sec)

        sig_low, sig_mid, sig_high = cls._split_3band_time_domain(mono, sr)

        edges = np.linspace(0, total_samples, num=target_cols + 1, dtype=np.int64)
        starts = edges[:-1]

        # Picos reales de 2.5 ms en C vectorizado (máxima nitidez de bombo, caja y hi-hats)
        low_pk = np.maximum.reduceat(np.abs(sig_low), starts)
        mid_pk = np.maximum.reduceat(np.abs(sig_mid), starts)
        high_pk = np.maximum.reduceat(np.abs(sig_high), starts)

        # Normalización relativa equilibrada (evita inflar ruido de fondo en pausas/breakdowns)
        ref_low = max(float(np.percentile(low_pk, 99.6)), 1e-5)
        ref_mid = max(float(np.percentile(mid_pk, 99.6)), ref_low * 0.42, 1e-5)
        ref_high = max(float(np.percentile(high_pk, 99.7)), ref_low * 0.30, 1e-5)

        def to_u8(arr: np.ndarray, ref: float, gamma: float) -> np.ndarray:
            norm = np.clip(arr / ref, 0.0, 1.0)
            shaped = np.power(norm, gamma)
            return np.clip(np.round(shaped * 255.0), 0, 255).astype(np.uint8)

        low_u8 = to_u8(low_pk, ref_low, gamma=0.76)
        mid_u8 = to_u8(mid_pk, ref_mid, gamma=0.84)
        high_u8 = to_u8(high_pk, ref_high, gamma=0.96)

        detail = np.stack([low_u8, mid_u8, high_u8], axis=1)

        ov_cols = min(OVERVIEW_COLUMNS, target_cols)
        ov_starts = np.linspace(0, target_cols, num=ov_cols + 1, dtype=np.int64)[:-1]
        overview = np.stack(
            [
                np.maximum.reduceat(low_u8, ov_starts),
                np.maximum.reduceat(mid_u8, ov_starts),
                np.maximum.reduceat(high_u8, ov_starts),
            ],
            axis=1,
        )

        return detail, overview, round(actual_cps, 4)

    def _put_mem_cache(self, cache_key: str, payload: Dict[str, Any]) -> None:
        with self._lock:
            self._mem_cache[cache_key] = payload
            self._mem_cache.move_to_end(cache_key)
            while len(self._mem_cache) > self._max_memory_entries:
                self._mem_cache.popitem(last=False)

    def _read_disk_cache(self, cache_key: str) -> Optional[Dict[str, Any]]:
        cpath = CACHE_DIR / f"{cache_key}.json"
        if not cpath.is_file():
            return None
        try:
            data = json.loads(cpath.read_text(encoding="utf-8"))
            if data.get("version") == CACHE_VERSION and data.get("bands_b64"):
                return data
        except Exception:
            pass
        return None

    def _write_disk_cache(self, cache_key: str, payload: Dict[str, Any]) -> None:
        cpath = CACHE_DIR / f"{cache_key}.json"
        tmp = CACHE_DIR / f"{cache_key}.tmp"
        try:
            tmp.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
            os.replace(tmp, cpath)
        except Exception:
            try:
                if tmp.exists():
                    tmp.unlink()
            except Exception:
                pass

    def get_waveform(self, filepath: str, block: bool = True) -> Optional[Dict[str, Any]]:
        """Devuelve el payload 3Band HD desde caché o lo calcula (deduplicando hilos)."""
        cache_key = self._build_cache_key(filepath)
        if not cache_key:
            return None

        with self._lock:
            if cache_key in self._mem_cache:
                self._mem_cache.move_to_end(cache_key)
                return self._mem_cache[cache_key]

        disk_hit = self._read_disk_cache(cache_key)
        if disk_hit is not None:
            self._put_mem_cache(cache_key, disk_hit)
            return disk_hit

        if not block:
            self.prefetch_async(filepath)
            return None

        wait_evt: Optional[threading.Event] = None
        is_owner = False
        with self._lock:
            if cache_key in self._mem_cache:
                return self._mem_cache[cache_key]
            if cache_key in self._in_flight:
                wait_evt = self._in_flight[cache_key]
            else:
                wait_evt = threading.Event()
                self._in_flight[cache_key] = wait_evt
                is_owner = True

        if not is_owner and wait_evt is not None:
            wait_evt.wait(timeout=15.0)
            with self._lock:
                return self._mem_cache.get(cache_key)

        try:
            t0 = time.perf_counter()
            mono, sr, duration_sec = self._decode_audio_mono(filepath)
            detail, overview, actual_cps = self._compute_3band_arrays(mono, sr, duration_sec)
            elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 1)

            payload: Dict[str, Any] = {
                "version": CACHE_VERSION,
                "cache_key": cache_key,
                "filepath": filepath,
                "duration_sec": round(duration_sec, 3),
                "sample_rate_proc": sr,
                "columns": int(detail.shape[0]),
                "columns_per_sec": actual_cps,
                "overview_columns": int(overview.shape[0]),
                "bands_b64": base64.b64encode(detail.tobytes()).decode("ascii"),
                "overview_b64": base64.b64encode(overview.tobytes()).decode("ascii"),
                "compute_ms": elapsed_ms,
                "real_fft": True,
            }
            self._put_mem_cache(cache_key, payload)
            self._write_disk_cache(cache_key, payload)
            return payload
        except Exception:
            return None
        finally:
            with self._lock:
                evt = self._in_flight.pop(cache_key, None)
                if evt is not None:
                    evt.set()

    def prefetch_async(self, filepath: str) -> None:
        """Lanza extracción 3Band HD en segundo plano sin bloquear el ticker ni CoreMIDI."""
        cache_key = self._build_cache_key(filepath)
        if not cache_key:
            return
        with self._lock:
            if cache_key in self._mem_cache or cache_key in self._in_flight:
                return
        if (CACHE_DIR / f"{cache_key}.json").is_file():
            return
        threading.Thread(
            target=self.get_waveform,
            args=(filepath, True),
            name=f"Waveform3BandHD-{cache_key[:8]}",
            daemon=True,
        ).start()


waveform_3band_extractor = Waveform3BandExtractor()
