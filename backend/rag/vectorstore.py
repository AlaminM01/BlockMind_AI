import os
import re
import math
import json
import pickle
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from collections import Counter
import numpy as np
from backend.config import VECTORSTORE_DIR, SIMILARITY_TOP_K, SIMILARITY_SCORE_THRESHOLD
from backend.rag.embeddings import LocalEmbeddingEngine
from backend.rag.document_processor import DocumentChunk
from backend.models.schemas import SourceDocument
from backend.utils.logger import setup_logger

logger = setup_logger("FAISSVectorStore")


class BM25Index:
    """
    Pure-Python, Zero-Dependency BM25Okapi sparse search implementation
    for exact blockchain keyword, opcode, and EIP retrieval.
    """
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.doc_len: List[int] = []
        self.avg_doc_len: float = 0.0
        self.corpus_size: int = 0
        self.doc_freqs: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.doc_token_counts: List[Counter] = []

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r"\b[a-zA-Z0-9_\-\.]{2,}\b", text.lower())

    def fit(self, corpus: List[str]):
        self.corpus_size = len(corpus)
        if self.corpus_size == 0:
            return

        self.doc_len = []
        self.doc_freqs = {}
        self.doc_token_counts = []
        total_len = 0

        for doc in corpus:
            tokens = self._tokenize(doc)
            self.doc_len.append(len(tokens))
            total_len += len(tokens)
            counts = Counter(tokens)
            self.doc_token_counts.append(counts)

            for token in counts.keys():
                self.doc_freqs[token] = self.doc_freqs.get(token, 0) + 1

        self.avg_doc_len = total_len / max(1, self.corpus_size)

        # Compute IDF
        self.idf = {}
        for token, freq in self.doc_freqs.items():
            # BM25 standard Robertson-Spärck Jones IDF
            self.idf[token] = math.log((self.corpus_size - freq + 0.5) / (freq + 0.5) + 1.0)

    def search(self, query: str, top_k: int = 10) -> List[Tuple[int, float]]:
        if self.corpus_size == 0 or not self.doc_len:
            return []

        q_tokens = self._tokenize(query)
        if not q_tokens:
            return []

        scores = [0.0] * self.corpus_size
        for token in q_tokens:
            if token not in self.idf:
                continue
            token_idf = self.idf[token]
            for doc_idx, counts in enumerate(self.doc_token_counts):
                tf = counts.get(token, 0)
                if tf > 0:
                    d_len = self.doc_len[doc_idx]
                    denom = tf + self.k1 * (1.0 - self.b + self.b * (d_len / max(1.0, self.avg_doc_len)))
                    scores[doc_idx] += token_idf * ((tf * (self.k1 + 1.0)) / denom)

        ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
        max_score = ranked[0][1] if ranked and ranked[0][1] > 0 else 1.0
        # Return index and normalized score
        return [(idx, score / max_score) for idx, score in ranked if score > 0][:top_k]


class FAISSVectorStore:
    """
    Advanced Local Vector Database using FAISS + BM25 Sparse Hybrid Search.
    Features:
    - Dense vector similarity (Cosine / FAISS IndexFlatIP)
    - Sparse keyword retrieval (BM25Okapi for EIPs, opcodes, exact terms)
    - Reciprocal Rank Fusion (RRF) for optimal context ranking
    - 100% Offline, no external cloud dependencies
    """
    def __init__(self, embedding_engine: LocalEmbeddingEngine, store_dir: Path = VECTORSTORE_DIR):
        self.embedding_engine = embedding_engine
        self.store_dir = Path(store_dir)
        self.store_dir.mkdir(parents=True, exist_ok=True)
        
        self.index_path = self.store_dir / "index.faiss"
        self.metadata_path = self.store_dir / "metadata.pkl"
        
        self.index = None
        self.chunks_metadata: List[Dict[str, Any]] = []
        self.bm25 = BM25Index()
        self._faiss_available = False
        
        self._init_faiss()
        self.load()

    def _init_faiss(self):
        try:
            import faiss
            self.faiss = faiss
            self._faiss_available = True
            logger.info("FAISS library initialized successfully.")
        except Exception as e:
            logger.warning(f"FAISS not available directly ({e}). Using Numpy cosine index fallback.")
            self._faiss_available = False

    def _rebuild_bm25(self):
        """Rebuilds the BM25 index over all stored chunk texts."""
        if self.chunks_metadata:
            texts = [c["content"] for c in self.chunks_metadata]
            self.bm25.fit(texts)

    def add_chunks(self, chunks: List[DocumentChunk]) -> int:
        """Add new chunks to the vector and BM25 index and persist."""
        if not chunks:
            return 0

        texts = [c.content for c in chunks]
        embeddings = self.embedding_engine.embed_documents(texts)
        
        if self._faiss_available:
            dim = embeddings.shape[1]
            if self.index is None:
                self.index = self.faiss.IndexFlatIP(dim)
            self.index.add(embeddings)
        
        # Save chunk metadata
        for i, chunk in enumerate(chunks):
            meta = {
                "id": chunk.id,
                "doc_id": chunk.doc_id,
                "book_name": chunk.book_name,
                "chapter": chunk.chapter,
                "page": chunk.page,
                "content": chunk.content,
                "metadata": chunk.metadata,
                "embedding": embeddings[i] if not self._faiss_available else None
            }
            self.chunks_metadata.append(meta)

        self._rebuild_bm25()
        self.save()
        logger.info(f"Added {len(chunks)} chunks to hybrid vector store. Total chunks: {len(self.chunks_metadata)}")
        return len(chunks)

    def search(self, query: str, top_k: int = SIMILARITY_TOP_K, threshold: float = SIMILARITY_SCORE_THRESHOLD) -> List[SourceDocument]:
        """
        Hybrid Search: Combines Dense FAISS Cosine Search + Sparse BM25 Keyword Search
        using Reciprocal Rank Fusion (RRF).
        """
        if not self.chunks_metadata:
            logger.warning("Vector store is empty. No documents indexed.")
            return []

        # 1. Dense Semantic Vector Search
        dense_results: List[Tuple[int, float]] = []
        query_vec = self.embedding_engine.embed_query(query)

        if self._faiss_available and self.index is not None and self.index.ntotal > 0:
            query_vec_2d = np.expand_dims(query_vec, axis=0)
            k = min(top_k * 3, self.index.ntotal)
            distances, indices = self.index.search(query_vec_2d, k)

            for score, idx in zip(distances[0], indices[0]):
                if 0 <= idx < len(self.chunks_metadata):
                    norm_score = float(max(0.0, min(1.0, (score + 1.0) / 2.0 if score < 0 else score)))
                    dense_results.append((int(idx), norm_score))
        else:
            # Cosine fallback
            cosine_scores = []
            for idx, meta in enumerate(self.chunks_metadata):
                emb = meta.get("embedding")
                if emb is None:
                    emb = self.embedding_engine.embed_query(meta["content"])
                score = float(np.dot(query_vec, emb) / (np.linalg.norm(query_vec) * np.linalg.norm(emb) + 1e-8))
                norm_score = float(max(0.0, min(1.0, score)))
                cosine_scores.append((idx, norm_score))
            cosine_scores.sort(key=lambda x: x[1], reverse=True)
            dense_results = cosine_scores[:top_k * 3]

        # 2. Sparse BM25 Keyword Search
        bm25_results = self.bm25.search(query, top_k=top_k * 3)
        dense_ranks = {doc_idx: rank for rank, (doc_idx, _) in enumerate(dense_results)}
        bm25_ranks = {doc_idx: rank for rank, (doc_idx, _) in enumerate(bm25_results)}

        # 3. Reciprocal Rank Fusion (RRF)
        all_candidates = set(dense_ranks.keys()).union(set(bm25_ranks.keys()))
        rrf_constant = 60.0
        combined_scores: List[Tuple[int, float, float]] = []

        dense_score_map = dict(dense_results)
        for doc_idx in all_candidates:
            dense_rank = dense_ranks.get(doc_idx, 999)
            bm25_rank = bm25_ranks.get(doc_idx, 999)

            rrf_score = (0.65 / (rrf_constant + dense_rank)) + (0.35 / (rrf_constant + bm25_rank))
            # Semantic score for reporting
            base_score = dense_score_map.get(doc_idx, 0.70)
            combined_scores.append((doc_idx, rrf_score, base_score))

        combined_scores.sort(key=lambda x: x[1], reverse=True)

        results: List[SourceDocument] = []
        for doc_idx, _, base_score in combined_scores[:top_k]:
            meta = self.chunks_metadata[doc_idx]
            if base_score >= (threshold * 0.75):
                results.append(
                    SourceDocument(
                        id=meta["id"],
                        book_name=meta["book_name"],
                        chapter=meta.get("chapter", "General"),
                        page=meta.get("page", 1),
                        content=meta["content"],
                        similarity_score=round(base_score, 4),
                        metadata=meta.get("metadata", {})
                    )
                )

        return results

    def remove_document(self, doc_id: str) -> int:
        """Remove all chunks belonging to a document and rebuild the index."""
        initial_len = len(self.chunks_metadata)
        remaining = [c for c in self.chunks_metadata if c.get("doc_id") != doc_id and c.get("metadata", {}).get("doc_id") != doc_id]
        
        removed_count = initial_len - len(remaining)
        if removed_count > 0:
            self.clear()
            if remaining:
                rebuilt_chunks = [
                    DocumentChunk(
                        id=m["id"],
                        doc_id=m.get("doc_id", "unknown"),
                        book_name=m["book_name"],
                        chapter=m.get("chapter", "General"),
                        page=m.get("page", 1),
                        content=m["content"],
                        metadata=m.get("metadata", {})
                    )
                    for m in remaining
                ]
                self.add_chunks(rebuilt_chunks)
            else:
                self.save()

        return removed_count

    def clear(self):
        """Reset the vector database index."""
        self.index = None
        self.chunks_metadata = []
        self.bm25 = BM25Index()
        if self.index_path.exists():
            self.index_path.unlink()
        if self.metadata_path.exists():
            self.metadata_path.unlink()
        logger.info("Vector store index cleared.")

    def save(self):
        """Persist index and metadata to disk."""
        try:
            if self._faiss_available and self.index is not None:
                self.faiss.write_index(self.index, str(self.index_path))
            
            with open(self.metadata_path, "wb") as f:
                pickle.dump(self.chunks_metadata, f)
            logger.info("Vector store persisted successfully.")
        except Exception as e:
            logger.error(f"Error persisting vector store: {e}")

    def load(self) -> bool:
        """Load persisted index and metadata from disk."""
        if not self.metadata_path.exists():
            return False

        try:
            with open(self.metadata_path, "rb") as f:
                self.chunks_metadata = pickle.load(f)

            if self._faiss_available and self.index_path.exists():
                self.index = self.faiss.read_index(str(self.index_path))

            self._rebuild_bm25()
            logger.info(f"Loaded hybrid vector store with {len(self.chunks_metadata)} chunks from disk.")
            return True
        except Exception as e:
            logger.error(f"Failed to load vector store from disk: {e}")
            return False

    @property
    def total_chunks(self) -> int:
        return len(self.chunks_metadata)
