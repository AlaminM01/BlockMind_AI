import os
import json
import pickle
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from backend.config import VECTORSTORE_DIR, SIMILARITY_TOP_K, SIMILARITY_SCORE_THRESHOLD
from backend.rag.embeddings import LocalEmbeddingEngine
from backend.rag.document_processor import DocumentChunk
from backend.models.schemas import SourceDocument
from backend.utils.logger import setup_logger

logger = setup_logger("FAISSVectorStore")

class FAISSVectorStore:
    """
    Local Vector Database using FAISS with metadata storage and persistence.
    100% Offline, no external databases or cloud dependencies.
    """
    def __init__(self, embedding_engine: LocalEmbeddingEngine, store_dir: Path = VECTORSTORE_DIR):
        self.embedding_engine = embedding_engine
        self.store_dir = Path(store_dir)
        self.store_dir.mkdir(parents=True, exist_ok=True)
        
        self.index_path = self.store_dir / "index.faiss"
        self.metadata_path = self.store_dir / "metadata.pkl"
        
        self.index = None
        self.chunks_metadata: List[Dict[str, Any]] = []
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

    def add_chunks(self, chunks: List[DocumentChunk]) -> int:
        """Add new chunks to the vector index and persist."""
        if not chunks:
            return 0

        texts = [c.content for c in chunks]
        embeddings = self.embedding_engine.embed_documents(texts)
        
        if self._faiss_available:
            dim = embeddings.shape[1]
            if self.index is None:
                # Use Inner Product (Cosine similarity on normalized vectors)
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

        self.save()
        logger.info(f"Added {len(chunks)} chunks to vector store. Total chunks: {len(self.chunks_metadata)}")
        return len(chunks)

    def search(self, query: str, top_k: int = SIMILARITY_TOP_K, threshold: float = SIMILARITY_SCORE_THRESHOLD) -> List[SourceDocument]:
        """Search vector database for top-k most relevant document chunks."""
        if not self.chunks_metadata:
            logger.warning("Vector store is empty. No documents indexed.")
            return []

        query_vec = self.embedding_engine.embed_query(query)
        results: List[SourceDocument] = []

        if self._faiss_available and self.index is not None and self.index.ntotal > 0:
            query_vec_2d = np.expand_dims(query_vec, axis=0)
            k = min(top_k, self.index.ntotal)
            distances, indices = self.index.search(query_vec_2d, k)

            for score, idx in zip(distances[0], indices[0]):
                if idx < 0 or idx >= len(self.chunks_metadata):
                    continue
                
                # Normalize cosine similarity score to [0.0, 1.0] range
                norm_score = float(max(0.0, min(1.0, (score + 1.0) / 2.0 if score < 0 else score)))
                
                if norm_score >= threshold:
                    meta = self.chunks_metadata[idx]
                    results.append(
                        SourceDocument(
                            id=meta["id"],
                            book_name=meta["book_name"],
                            chapter=meta.get("chapter", "General"),
                            page=meta.get("page", 1),
                            content=meta["content"],
                            similarity_score=round(norm_score, 4),
                            metadata=meta.get("metadata", {})
                        )
                    )
        else:
            # Fallback in-memory Cosine search
            scores = []
            for idx, meta in enumerate(self.chunks_metadata):
                emb = meta.get("embedding")
                if emb is None:
                    emb = self.embedding_engine.embed_query(meta["content"])
                score = float(np.dot(query_vec, emb) / (np.linalg.norm(query_vec) * np.linalg.norm(emb) + 1e-8))
                norm_score = float(max(0.0, min(1.0, score)))
                if norm_score >= threshold:
                    scores.append((norm_score, meta))

            scores.sort(key=lambda x: x[0], reverse=True)
            for norm_score, meta in scores[:top_k]:
                results.append(
                    SourceDocument(
                        id=meta["id"],
                        book_name=meta["book_name"],
                        chapter=meta.get("chapter", "General"),
                        page=meta.get("page", 1),
                        content=meta["content"],
                        similarity_score=round(norm_score, 4),
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
                # Reconstruct chunks
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

            logger.info(f"Loaded vector store with {len(self.chunks_metadata)} chunks from disk.")
            return True
        except Exception as e:
            logger.error(f"Failed to load vector store from disk: {e}")
            return False

    @property
    def total_chunks(self) -> int:
        return len(self.chunks_metadata)
