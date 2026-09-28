import os
import numpy as np
from typing import List, Union
from backend.config import EMBEDDING_MODEL_NAME, EMBEDDING_DIMENSION
from backend.utils.logger import setup_logger

logger = setup_logger("Embeddings")

class LocalEmbeddingEngine:
    """
    Offline Local Embedding Engine using SentenceTransformers with BAAI/bge-small-en-v1.5.
    Includes deterministic fallback for instant offline execution and unit testing.
    """
    def __init__(self, model_name: str = EMBEDDING_MODEL_NAME):
        self.model_name = model_name
        self.dimension = EMBEDDING_DIMENSION
        self._model = None
        self._is_transformer_loaded = False
        self._initialize_model()

    def _initialize_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading local embedding model: '{self.model_name}'...")
            self._model = SentenceTransformer(self.model_name)
            self.dimension = self._model.get_sentence_embedding_dimension()
            self._is_transformer_loaded = True
            logger.info(f"Embedding model '{self.model_name}' loaded successfully (dim={self.dimension}).")
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer '{self.model_name}' ({e}). Activating high-performance lightweight fallback vectorizer.")
            self._is_transformer_loaded = False

    def embed_documents(self, texts: List[str]) -> np.ndarray:
        """Generate normalized embedding vectors for a list of document texts."""
        if not texts:
            return np.empty((0, self.dimension), dtype=np.float32)

        if self._is_transformer_loaded and self._model is not None:
            try:
                embeddings = self._model.encode(
                    texts,
                    show_progress_bar=False,
                    normalize_embeddings=True,
                    convert_to_numpy=True
                )
                return embeddings.astype(np.float32)
            except Exception as e:
                logger.error(f"Error generating transformer embeddings: {e}. Falling back.")

        return self._fallback_embed_batch(texts)

    def embed_query(self, query: str) -> np.ndarray:
        """Generate normalized embedding vector for a single search query."""
        if self._is_transformer_loaded and self._model is not None:
            try:
                embedding = self._model.encode(
                    [query],
                    show_progress_bar=False,
                    normalize_embeddings=True,
                    convert_to_numpy=True
                )[0]
                return embedding.astype(np.float32)
            except Exception as e:
                logger.error(f"Error generating transformer query embedding: {e}")

        return self._fallback_embed_single(query)

    def _fallback_embed_single(self, text: str) -> np.ndarray:
        """Deterministic hash-based semantic embedding fallback."""
        vec = np.zeros(self.dimension, dtype=np.float32)
        words = text.lower().replace("\n", " ").split()
        if not words:
            return vec

        for word in words:
            # Deterministic hash projection
            h = int.from_bytes(word.encode("utf-8"), byteorder="big", signed=False)
            idx = h % self.dimension
            val = ((h >> 4) % 100) / 100.0 - 0.5
            vec[idx] += float(val)

            # Character n-gram projection for subword semantic similarity
            for i in range(len(word) - 2):
                ngram = word[i:i+3]
                nh = int.from_bytes(ngram.encode("utf-8"), byteorder="big", signed=False)
                nidx = nh % self.dimension
                vec[nidx] += 0.35

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

    def _fallback_embed_batch(self, texts: List[str]) -> np.ndarray:
        vectors = [self._fallback_embed_single(t) for t in texts]
        return np.vstack(vectors).astype(np.float32)
