"""
BeatWave PRO - Phase 2 GPU Neural Rescue: Vector Search Engine (FAISS & Milvus)
==============================================================================
Scalable Nearest Neighbor Search (ANN) for 128-Dimensional Acoustic Embeddings.

Key Capabilities:
- FAISS Backend: Supports `IndexFlatIP` (Exact Cosine Similarity for L2-normalized
  Conformer embeddings) and `IndexFlatL2`. Automatically detects and leverages
  `faiss-gpu` (StandardGpuResources) when running under CUDA.
- Milvus Backend: Optional high-throughput distributed cluster client (PyMilvus)
  with automatic fallback to local FAISS.
- Metadata Registry: Maps vector IDs to rich track metadata (ISRC, title, artist,
  album, BPM, key, genre tags, and temporal timestamps).
- Top-1 and Top-K Queries with Confidence Calibration (0-100%).
- Disk Persistence: Fast binary index serialization via `faiss.write_index`
  and JSON metadata sidecars.
"""

import os
import json
import time
import logging
from typing import Dict, Any, List, Optional, Tuple, Union
import numpy as np

logger = logging.getLogger("BeatWave.VectorSearch")

EMBEDDING_DIM = 128


class VectorSearchEngine:
    """
    Motor de Búsqueda Vectorial de Vecinos Más Cercanos (ANN) basado en FAISS.
    Optimizado para vectores unitarios de 128 dimensiones generados por Conformer.
    """

    def __init__(
        self,
        dim: int = EMBEDDING_DIM,
        metric: str = "IP",  # "IP" (Inner Product / Coseno) o "L2"
        use_gpu: bool = False,
        gpu_id: int = 0
    ):
        self.dim = dim
        self.metric = metric.upper()
        self.use_gpu = use_gpu
        self.gpu_id = gpu_id
        self.tracks_metadata: List[Dict[str, Any]] = []
        self.id_to_index: Dict[str, int] = {}
        self.index = None
        self.gpu_res = None

        self._init_faiss_index()

    def _init_faiss_index(self):
        """Inicializa el índice FAISS en CPU o GPU."""
        try:
            import faiss

            if self.metric == "IP":
                # Inner Product en vectores L2-normalizados equivale a Cosine Similarity
                cpu_index = faiss.IndexFlatIP(self.dim)
            elif self.metric == "L2":
                cpu_index = faiss.IndexFlatL2(self.dim)
            else:
                raise ValueError(f"Métrica no soportada: {self.metric}. Use 'IP' o 'L2'.")

            # Intentar aceleración FAISS GPU si está disponible
            if self.use_gpu and hasattr(faiss, "StandardGpuResources"):
                try:
                    self.gpu_res = faiss.StandardGpuResources()
                    self.index = faiss.index_cpu_to_gpu(self.gpu_res, self.gpu_id, cpu_index)
                    logger.info(f"[VectorSearchEngine] FAISS GPU habilitado en GPU {self.gpu_id} (Métrica: {self.metric})")
                    return
                except Exception as e_gpu:
                    logger.warning(f"[VectorSearchEngine] No se pudo inicializar FAISS GPU ({e_gpu}), usando CPU.")

            self.index = cpu_index
            logger.info(f"[VectorSearchEngine] FAISS CPU inicializado (Métrica: {self.metric}, Dim: {self.dim})")

        except ImportError:
            logger.warning("[VectorSearchEngine] faiss no está instalado. Utilizando fallback con NumPy.")
            self.index = None
            self.embeddings_matrix: Optional[np.ndarray] = None

    def add_track(
        self,
        track_id: str,
        embedding: Union[np.ndarray, List[float]],
        metadata: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Registra una pista y su vector de embedding en el índice.
        Retorna el índice entero asignado en FAISS.
        """
        emb = np.asarray(embedding, dtype=np.float32).flatten()
        if emb.shape[0] != self.dim:
            raise ValueError(f"Dimensión incorrecta: esperado {self.dim}, recibido {emb.shape[0]}")

        # Asegurar normalización L2 unitaria
        norm = np.linalg.norm(emb)
        if norm > 1e-6:
            emb = emb / norm

        emb_matrix = np.expand_dims(emb, axis=0)

        meta = {
            "track_id": track_id,
            "title": metadata.get("title", "Unknown Title") if metadata else "Unknown Title",
            "artist": metadata.get("artist", "Unknown Artist") if metadata else "Unknown Artist",
            "album": metadata.get("album", "") if metadata else "",
            "isrc": metadata.get("isrc", "") if metadata else "",
            "bpm": metadata.get("bpm", 130.0) if metadata else 130.0,
            "key": metadata.get("key", "") if metadata else "",
            "genres": metadata.get("genres", ["Techno"]) if metadata else ["Techno"]
        }

        if self.index is not None:
            self.index.add(emb_matrix)
            assigned_idx = len(self.tracks_metadata)
            self.tracks_metadata.append(meta)
            self.id_to_index[track_id] = assigned_idx
            return assigned_idx

        # Fallback NumPy
        if not hasattr(self, "embeddings_matrix") or self.embeddings_matrix is None:
            self.embeddings_matrix = emb_matrix
        else:
            self.embeddings_matrix = np.vstack([self.embeddings_matrix, emb_matrix])

        assigned_idx = len(self.tracks_metadata)
        self.tracks_metadata.append(meta)
        self.id_to_index[track_id] = assigned_idx
        return assigned_idx

    def add_tracks_batch(
        self,
        track_ids: List[str],
        embeddings: np.ndarray,
        metadatas: Optional[List[Dict[str, Any]]] = None
    ) -> int:
        """Agrega un lote de pistas y sus vectores de forma vectorial optimizada."""
        embs = np.asarray(embeddings, dtype=np.float32)
        if embs.shape[1] != self.dim:
            raise ValueError(f"Dimensión esperada {self.dim}, recibida {embs.shape[1]}")

        # Normalizar lote completo
        norms = np.linalg.norm(embs, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        embs = embs / norms

        if self.index is not None:
            self.index.add(embs)
        else:
            if not hasattr(self, "embeddings_matrix") or self.embeddings_matrix is None:
                self.embeddings_matrix = embs
            else:
                self.embeddings_matrix = np.vstack([self.embeddings_matrix, embs])

        start_idx = len(self.tracks_metadata)
        for i, tid in enumerate(track_ids):
            meta = metadatas[i] if metadatas and i < len(metadatas) else {}
            item = {
                "track_id": tid,
                "title": meta.get("title", f"Track {tid}"),
                "artist": meta.get("artist", "Unknown Artist"),
                "album": meta.get("album", ""),
                "isrc": meta.get("isrc", ""),
                "bpm": meta.get("bpm", 130.0),
                "key": meta.get("key", ""),
                "genres": meta.get("genres", ["Techno"])
            }
            self.tracks_metadata.append(item)
            self.id_to_index[tid] = start_idx + i

        return len(track_ids)

    def search_top1(
        self,
        query_embedding: Union[np.ndarray, List[float]],
        min_confidence: float = 65.0
    ) -> Optional[Dict[str, Any]]:
        """
        Busca la pista Top-1 más similar para un vector embedding de consulta.
        Retorna la coincidencia con metadata y confianza calibrada (0..100%).
        """
        results = self.search_top_k(query_embedding, k=1)
        if not results:
            return None

        top1 = results[0]
        if top1["score"] >= min_confidence:
            return top1
        return None

    def search_top_k(
        self,
        query_embedding: Union[np.ndarray, List[float]],
        k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Ejecuta una búsqueda de los Top-K vecinos más cercanos.
        """
        t0 = time.time()
        q = np.asarray(query_embedding, dtype=np.float32).flatten()
        if q.shape[0] != self.dim:
            raise ValueError(f"Dimensión de consulta incorrecta: {q.shape[0]} != {self.dim}")

        norm = np.linalg.norm(q)
        if norm > 1e-6:
            q = q / norm
        q_matrix = np.expand_dims(q, axis=0)

        total_tracks = len(self.tracks_metadata)
        if total_tracks == 0:
            return []

        actual_k = min(k, total_tracks)

        if self.index is not None:
            # Búsqueda nativa FAISS
            distances, indices = self.index.search(q_matrix, actual_k)
            dists = distances[0]
            idxs = indices[0]
        else:
            # Fallback NumPy
            if self.metric == "IP":
                sims = np.dot(self.embeddings_matrix, q)
                idxs = np.argsort(sims)[::-1][:actual_k]
                dists = sims[idxs]
            else:
                diffs = self.embeddings_matrix - q
                l2s = np.linalg.norm(diffs, axis=1)
                idxs = np.argsort(l2s)[:actual_k]
                dists = l2s[idxs]

        elapsed_ms = (time.time() - t0) * 1000.0

        matches = []
        for dist, idx in zip(dists, idxs):
            if idx < 0 or idx >= len(self.tracks_metadata):
                continue

            meta = self.tracks_metadata[idx]
            
            # Calibración de Confianza (Score 0-100)
            if self.metric == "IP":
                # Inner product en vectores normalizados está en [-1.0, 1.0]
                similarity = float(dist)
                # Mapeo a porcentaje de confianza: [0.70 .. 1.0] -> [70% .. 100%]
                score = round(max(0.0, min(100.0, similarity * 100.0)), 2)
            else:
                # Distancia L2: menor distancia = mayor similitud
                # ||u - v||^2 = 2 - 2 * cos(theta)
                l2_dist = float(dist)
                similarity = max(0.0, 1.0 - (l2_dist / 2.0))
                score = round(similarity * 100.0, 2)

            matches.append({
                "track_id": meta["track_id"],
                "title": meta["title"],
                "artist": meta["artist"],
                "album": meta["album"],
                "isrc": meta["isrc"],
                "bpm": meta["bpm"],
                "key": meta["key"],
                "genres": meta["genres"],
                "score": score,
                "similarity": round(similarity, 4),
                "raw_distance": round(float(dist), 4),
                "search_latency_ms": round(elapsed_ms, 3)
            })

        return matches

    def save_index(self, directory: str = "index_storage") -> bool:
        """Serializa el índice FAISS y el catálogo de metadatos a disco."""
        try:
            os.makedirs(directory, exist_ok=True)
            index_path = os.path.join(directory, "conformer_faiss.index")
            meta_path = os.path.join(directory, "catalog_metadata.json")

            if self.index is not None:
                import faiss
                # Si está en GPU, transferir a CPU antes de escribir
                cpu_index = faiss.index_gpu_to_cpu(self.index) if hasattr(faiss, "index_gpu_to_cpu") and self.use_gpu else self.index
                faiss.write_index(cpu_index, index_path)

            with open(meta_path, "w", encoding="utf-8") as f:
                json.dump({
                    "tracks": self.tracks_metadata,
                    "id_to_index": self.id_to_index,
                    "dim": self.dim,
                    "metric": self.metric
                }, f, indent=2)

            logger.info(f"[VectorSearchEngine] Índice guardado en {directory}")
            return True
        except Exception as e:
            logger.error(f"[VectorSearchEngine] Error al guardar índice: {e}")
            return False

    def load_index(self, directory: str = "index_storage") -> bool:
        """Carga un índice FAISS previamente serializado y su catálogo de metadatos."""
        try:
            index_path = os.path.join(directory, "conformer_faiss.index")
            meta_path = os.path.join(directory, "catalog_metadata.json")

            if not os.path.exists(index_path) or not os.path.exists(meta_path):
                return False

            import faiss
            self.index = faiss.read_index(index_path)

            with open(meta_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.tracks_metadata = data.get("tracks", [])
                self.id_to_index = data.get("id_to_index", {})
                self.dim = data.get("dim", EMBEDDING_DIM)
                self.metric = data.get("metric", "IP")

            logger.info(f"[VectorSearchEngine] Índice cargado desde {directory} ({len(self.tracks_metadata)} pistas)")
            return True
        except Exception as e:
            logger.error(f"[VectorSearchEngine] Error cargando índice: {e}")
            return False

    def seed_demo_catalog(self, extractor: Any = None):
        """
        Siembra un catálogo de referencia con tracks reales de la escena Techno / Hard Techno
        para demostración inmediata y pruebas de stress del motor de rescate.
        """
        demo_tracks = [
            {
                "track_id": "trk_cdw_001",
                "title": "Overdrive",
                "artist": "Charlotte de Witte",
                "album": "Overdrive EP",
                "bpm": 138.0,
                "key": "Fm",
                "genres": ["Hard Techno", "Acid"]
            },
            {
                "track_id": "trk_cdw_002",
                "title": "Doppler",
                "artist": "Charlotte de Witte",
                "album": "Apollo EP",
                "bpm": 136.0,
                "key": "Gm",
                "genres": ["Peak-Time Techno"]
            },
            {
                "track_id": "trk_al_001",
                "title": "In My Mind",
                "artist": "Amelie Lens",
                "album": "Basiel EP",
                "bpm": 135.0,
                "key": "Am",
                "genres": ["Hard Techno", "Acid Techno"]
            },
            {
                "track_id": "trk_es_001",
                "title": "The Sound of Space",
                "artist": "Enrico Sangiuliano",
                "album": "Niche EP",
                "bpm": 132.0,
                "key": "Dm",
                "genres": ["Peak-Time Techno"]
            },
            {
                "track_id": "trk_rz_001",
                "title": "Move Your Body To The Beat",
                "artist": "Reinier Zonneveld",
                "album": "Filth On Acid",
                "bpm": 140.0,
                "key": "Em",
                "genres": ["Hard Techno"]
            },
            {
                "track_id": "trk_sl_001",
                "title": "No Sleep",
                "artist": "Sara Landry",
                "album": "Hekate",
                "bpm": 145.0,
                "key": "Bbm",
                "genres": ["Hard Techno", "Industrial"]
            }
        ]

        np.random.seed(1337)
        for trk in demo_tracks:
            # Generar embedding sintético representativo de 128 dimensiones
            # Si se suministra el extractor, se puede extraer de una señal acústica sintética
            if extractor is not None:
                # Síntesis aditiva determinista simulando el kick/bassline del track
                bpm = trk["bpm"]
                t = np.linspace(0, 3.0, 48000, endpoint=False)
                beat_freq = bpm / 60.0
                waveform = (
                    0.6 * np.sin(2 * np.pi * 55 * t) * (np.sin(2 * np.pi * beat_freq * t) ** 4) +
                    0.3 * np.sin(2 * np.pi * 220 * t) +
                    0.1 * np.random.randn(len(t))
                ).astype(np.float32)
                emb = extractor.extract_embedding(waveform)
            else:
                raw_emb = np.random.randn(EMBEDDING_DIM).astype(np.float32)
                emb = raw_emb / np.linalg.norm(raw_emb)

            self.add_track(trk["track_id"], emb, trk)

        logger.info(f"[VectorSearchEngine] Catálogo demo sembrado con {len(demo_tracks)} pistas.")


# ============================================================================
# 2. ADAPTADOR MILVUS (PyMilvus Distributed Cluster Adapter)
# ============================================================================
class MilvusVectorSearchEngine:
    """
    Cliente para Clúster Distribuido Milvus (Zilliz / Milvus Standalone/Distributed).
    Se utiliza en despliegues cloud a gran escala (millones de vectores).
    Si Milvus no está accesible, delega automáticamente a VectorSearchEngine (FAISS).
    """

    def __init__(
        self,
        host: str = "127.0.0.1",
        port: str = "19530",
        collection_name: str = "beatwave_neural_fingerprints",
        dim: int = EMBEDDING_DIM
    ):
        self.host = host
        self.port = port
        self.collection_name = collection_name
        self.dim = dim
        self.milvus_connected = False
        self.collection = None
        self.fallback_faiss = VectorSearchEngine(dim=dim, metric="IP")

        self._try_connect()

    def _try_connect(self):
        """Intenta conectar a Milvus e inicializar la colección."""
        try:
            from pymilvus import connections, FieldSchema, CollectionSchema, DataType, Collection

            connections.connect("default", host=self.host, port=self.port, timeout=1.5)
            self.milvus_connected = True

            # Definir esquema si no existe
            fields = [
                FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
                FieldSchema(name="track_id", dtype=DataType.VARCHAR, max_length=64),
                FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=self.dim),
                FieldSchema(name="title", dtype=DataType.VARCHAR, max_length=128),
                FieldSchema(name="artist", dtype=DataType.VARCHAR, max_length=128),
                FieldSchema(name="metadata_json", dtype=DataType.VARCHAR, max_length=2048)
            ]
            schema = CollectionSchema(fields, description="BeatWave Conformer 128D Fingerprints")
            self.collection = Collection(self.collection_name, schema)

            # Crear índice IVF_FLAT o HNSW para Milvus
            index_params = {
                "metric_type": "IP",
                "index_type": "IVF_FLAT",
                "params": {"nlist": 1024}
            }
            if not self.collection.has_index():
                self.collection.create_index(field_name="embedding", index_params=index_params)
            self.collection.load()
            logger.info(f"[Milvus] Conectado exitosamente a {self.host}:{self.port}, colección: {self.collection_name}")

        except Exception as e:
            logger.info(f"[Milvus] Clúster Milvus no disponible ({e}). Operando en modo local FAISS.")
            self.milvus_connected = False

    def add_track(self, track_id: str, embedding: np.ndarray, metadata: Dict[str, Any]) -> int:
        if self.milvus_connected and self.collection is not None:
            try:
                emb = np.asarray(embedding, dtype=np.float32).flatten().tolist()
                data = [
                    [track_id],
                    [emb],
                    [metadata.get("title", "")],
                    [metadata.get("artist", "")],
                    [json.dumps(metadata)]
                ]
                self.collection.insert(data)
                return 1
            except Exception as e:
                logger.warning(f"[Milvus] Fallo en inserción ({e}), usando FAISS.")
        
        return self.fallback_faiss.add_track(track_id, embedding, metadata)

    def search_top1(self, query_embedding: np.ndarray, min_confidence: float = 65.0) -> Optional[Dict[str, Any]]:
        if self.milvus_connected and self.collection is not None:
            try:
                emb = np.asarray(query_embedding, dtype=np.float32).flatten().tolist()
                search_params = {"metric_type": "IP", "params": {"nprobe": 16}}
                res = self.collection.search(
                    data=[emb],
                    anns_field="embedding",
                    param=search_params,
                    limit=1,
                    output_fields=["track_id", "title", "artist", "metadata_json"]
                )
                if res and len(res[0]) > 0:
                    hit = res[0][0]
                    similarity = float(hit.distance)
                    score = round(max(0.0, min(100.0, similarity * 100.0)), 2)
                    if score >= min_confidence:
                        meta = json.loads(hit.entity.get("metadata_json") or "{}")
                        return {
                            "track_id": hit.entity.get("track_id"),
                            "title": hit.entity.get("title"),
                            "artist": hit.entity.get("artist"),
                            "album": meta.get("album", ""),
                            "score": score,
                            "similarity": round(similarity, 4),
                            "source": "milvus_ann_cluster"
                        }
            except Exception as e:
                logger.warning(f"[Milvus] Fallo en búsqueda ({e}), delegando a FAISS.")

        return self.fallback_faiss.search_top1(query_embedding, min_confidence)
