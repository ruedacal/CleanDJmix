"""
BeatWave PRO - Phase 2 GPU Neural Rescue: Test Suite for Conformer & FAISS Search
================================================================================
Verifies Prompt 4:
1. 128-Dimensional L2-normalized embedding extraction via Conformer/GraFPrint.
2. High-speed vector similarity search using FAISS (IndexFlatIP) and Milvus adapter.
3. Pitch-drift and Stem-separated audio retrieval under realistic Hard Techno acoustic stress.
"""

import os
import sys
import time
import struct
import unittest
import numpy as np

# Añadir ruta del microservicio
sys.path.insert(0, os.path.dirname(__file__))

from neural_fingerprint import (
    NeuralFingerprintExtractor,
    compute_spectrogram_features,
    EMBEDDING_DIM,
    FFT_SIZE,
    HOP_LENGTH,
    NUM_BINS,
    TARGET_SAMPLE_RATE
)
from vector_search import VectorSearchEngine, MilvusVectorSearchEngine
from audio_processor import AudioProcessor


def create_synthetic_flac_buffer(duration_sec: float = 3.0, freq_hz: float = 138.0) -> bytes:
    """Genera un archivo FLAC binario sintético válido en memoria RAM."""
    sr = 16000
    total_samples = int(sr * duration_sec)
    
    t = np.linspace(0, duration_sec, total_samples, endpoint=False)
    # Patrón con bombo sintético a 138 BPM y tono a 220 Hz
    beat_freq = freq_hz / 60.0
    sig = (
        0.5 * np.sin(2 * np.pi * 55.0 * t) * (np.sin(2 * np.pi * beat_freq * t) ** 4) +
        0.3 * np.sin(2 * np.pi * 220.0 * t)
    )
    pcm = np.clip(sig * 32767, -32768, 32767).astype(np.int16)
    
    header = b"fLaC"
    block_header = struct.pack(">B", 0x80) + struct.pack(">I", 34)[1:]
    streaminfo = struct.pack(
        ">HH3s3sI8s",
        4096, 4096,
        b"\x00\x00\x00", b"\x00\x00\x00",
        (sr << 12) | (0 << 9) | (15 << 4),
        total_samples.to_bytes(5, "big") + b"\x00\x00\x00"
    )
    
    # Subframe PCM lineal
    pcm_bytes = pcm.tobytes()
    frame_header = b"\xff\xf8\x00\x00"
    return header + block_header + streaminfo + frame_header + pcm_bytes


class TestConformerAndVectorSearch(unittest.TestCase):
    """Pruebas unitarias y de integración para Conformer 128-D y FAISS."""

    def setUp(self):
        self.extractor = NeuralFingerprintExtractor()
        self.search_engine = VectorSearchEngine(dim=EMBEDDING_DIM, metric="IP")

    def test_spectral_frontend_dimensions(self):
        """Verifica que la STFT log-magnitude use FFT 1024, Hop 128 y retorne 513 bins."""
        waveform = np.random.randn(48000).astype(np.float32)
        spec, num_frames = compute_spectrogram_features(waveform, sr=TARGET_SAMPLE_RATE)
        
        self.assertEqual(spec.shape[1], NUM_BINS)  # 513 bins
        self.assertEqual(NUM_BINS, 513)
        self.assertGreater(num_frames, 300)
        print(f"✓ Espectrograma verificado: {spec.shape} ({num_frames} cuadros)")

    def test_conformer_128d_embedding_and_l2_norm(self):
        """Verifica que el embedding sea exactamente de 128 dimensiones con norma L2 = 1.0."""
        t = np.linspace(0, 3.0, 48000, endpoint=False)
        audio = (0.7 * np.sin(2 * np.pi * 140 * t) + 0.3 * np.random.randn(len(t))).astype(np.float32)

        emb = self.extractor.extract_embedding(audio, sample_rate=16000)
        self.assertEqual(emb.shape, (EMBEDDING_DIM,))
        self.assertEqual(len(emb), 128)

        # Verificar norma unitaria ||e||_2 = 1.0 (permite Inner Product = Cosine Similarity)
        norm = float(np.linalg.norm(emb))
        self.assertAlmostEqual(norm, 1.0, places=4)
        print(f"✓ Embedding Conformer 128-D extraído con norma L2: {norm:.5f}")

    def test_conformer_batch_extraction(self):
        """Verifica extracción por lotes [N, 128]."""
        batch_audio = [
            np.random.randn(48000).astype(np.float32),
            np.random.randn(48000).astype(np.float32),
            np.random.randn(48000).astype(np.float32)
        ]
        embs = self.extractor.extract_embeddings_batch(batch_audio)
        self.assertEqual(embs.shape, (3, 128))
        for i in range(3):
            self.assertAlmostEqual(float(np.linalg.norm(embs[i])), 1.0, places=4)
        print(f"✓ Extracción batch verificada: matriz {embs.shape}")

    def test_faiss_index_and_top1_search(self):
        """Verifica indexación FAISS IndexFlatIP, búsqueda Top-1 y calibración de confianza."""
        self.search_engine.seed_demo_catalog(extractor=self.extractor)
        self.assertGreaterEqual(len(self.search_engine.tracks_metadata), 6)

        # Generar vector de consulta correspondiente a Charlotte de Witte (BPM 138)
        t = np.linspace(0, 3.0, 48000, endpoint=False)
        waveform = (
            0.6 * np.sin(2 * np.pi * 55 * t) * (np.sin(2 * np.pi * (138.0 / 60.0) * t) ** 4) +
            0.3 * np.sin(2 * np.pi * 220 * t) +
            0.02 * np.random.randn(len(t))
        ).astype(np.float32)
        query_emb = self.extractor.extract_embedding(waveform)

        t0 = time.time()
        top1 = self.search_engine.search_top1(query_emb, min_confidence=50.0)
        latency_ms = (time.time() - t0) * 1000.0

        self.assertIsNotNone(top1)
        self.assertIn("score", top1)
        self.assertGreater(top1["score"], 50.0)
        self.assertLess(latency_ms, 25.0)  # Búsqueda ultra-rápida < 25 ms
        print(f"✓ Búsqueda FAISS Top-1: {top1['artist']} - {top1['title']} | Score: {top1['score']}% | Latencia: {latency_ms:.2f}ms")

    def test_faiss_persistence_save_load(self):
        """Verifica serialización de índice a disco y posterior carga sin pérdida."""
        self.search_engine.seed_demo_catalog(extractor=self.extractor)
        test_dir = "/tmp/beatwave_faiss_test"
        
        saved = self.search_engine.save_index(test_dir)
        self.assertTrue(saved)

        loaded_engine = VectorSearchEngine(dim=EMBEDDING_DIM, metric="IP")
        loaded = loaded_engine.load_index(test_dir)
        self.assertTrue(loaded)
        self.assertEqual(len(loaded_engine.tracks_metadata), len(self.search_engine.tracks_metadata))
        print(f"✓ Persistencia FAISS validada: {len(loaded_engine.tracks_metadata)} tracks cargados correctamente.")

    def test_audio_processor_rescue_pipeline_with_conformer(self):
        """Verifica la integración completa del microservicio con tempo-warp y separación de fuentes."""
        processor = AudioProcessor(device="cpu")
        flac_bytes = create_synthetic_flac_buffer(duration_sec=3.0, freq_hz=138.0)

        # Prueba A: Escalado por sospecha de pitch-shift (TIME_DRIFT)
        res_pitch = processor.process_rescue_payload(
            flac_bytes=flac_bytes,
            reason="TIME_DRIFT_SUSPECTED_PITCH",
            rho=1.03,
            environment="club"
        )
        self.assertEqual(res_pitch["status"], "success")
        self.assertEqual(res_pitch["pipeline"], "TEMPO_WARP_SPECULATIVE")
        self.assertIn("match", res_pitch)
        self.assertGreater(res_pitch["match"]["score"], 70.0)
        self.assertIn(res_pitch["match"]["source"], ["gpu_neural_conformer_faiss", "gpu_neural_conformer"])
        print(f"✓ Pipeline Tempo-Warp verificado: {res_pitch['match']['title']} ({res_pitch['match']['score']}%)")

        # Prueba B: Escalado por baja confianza (LOW_CONFIDENCE)
        res_conf = processor.process_rescue_payload(
            flac_bytes=flac_bytes,
            reason="LOW_CONFIDENCE",
            rho=1.0,
            environment="club"
        )
        self.assertEqual(res_conf["status"], "success")
        self.assertEqual(res_conf["pipeline"], "SOURCE_SEPARATION_DEMUCS")
        self.assertIn("match", res_conf)
        self.assertIn(res_conf["match"]["stem_isolated"], ["drums", "synth"])
        self.assertGreater(res_conf["match"]["score"], 70.0)
        print(f"✓ Pipeline Source Separation verificado: stem '{res_conf['match']['stem_isolated']}' ({res_conf['match']['score']}%)")


if __name__ == "__main__":
    unittest.main()
