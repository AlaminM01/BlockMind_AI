import time
from typing import List, Dict, Any, Tuple, Optional, Generator
from backend.rag.vectorstore import FAISSVectorStore
from backend.rag.prompts import SYSTEM_RAG_PROMPT, FALLBACK_NOT_FOUND_MESSAGE
from backend.services.ollama_service import OllamaService
from backend.models.schemas import QueryResponse, SourceDocument
from backend.utils.logger import setup_logger

logger = setup_logger("RAGPipeline")

class RAGPipeline:
    """
    End-to-End RAG Chain orchestrator.
    Retrieves context from FAISS and synthesizes grounded answers via local LLM.
    """
    def __init__(self, vector_store: FAISSVectorStore, ollama_service: OllamaService):
        self.vector_store = vector_store
        self.ollama_service = ollama_service

    def answer_query(
        self,
        query: str,
        session_id: str = "default",
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        top_k: Optional[int] = None
    ) -> QueryResponse:
        """Run full RAG pipeline and return grounded response with source metadata."""
        start_time = time.time()
        
        # Step 1: Semantic Search in local vector store
        sources: List[SourceDocument] = self.vector_store.search(
            query=query,
            top_k=top_k or 4
        )

        # Step 2: AI Safety & Grounding Check
        if not sources:
            elapsed = time.time() - start_time
            logger.info(f"Query '{query}' returned zero matching chunks.")
            return QueryResponse(
                answer=FALLBACK_NOT_FOUND_MESSAGE,
                query=query,
                sources=[],
                session_id=session_id,
                execution_time_seconds=round(elapsed, 3),
                model_used=model or self.ollama_service.default_model,
                is_safe=True,
                context_found=False
            )

        # Step 3: Construct Context Window with Book Citations
        context_blocks = []
        for idx, src in enumerate(sources):
            header = f"[Source {idx+1}: {src.book_name} | {src.chapter} (Page {src.page}) | Match: {int(src.similarity_score * 100)}%]"
            context_blocks.append(f"{header}\n{src.content}")

        formatted_context = "\n\n---\n\n".join(context_blocks)
        prompt = SYSTEM_RAG_PROMPT.format(
            context=formatted_context,
            question=query
        )

        # Step 4: Generate LLM completion
        answer = self.ollama_service.generate(
            prompt=prompt,
            model=model,
            temperature=temperature
        )

        elapsed = time.time() - start_time
        logger.info(f"RAG query executed in {elapsed:.2f}s with {len(sources)} sources.")

        return QueryResponse(
            answer=answer,
            query=query,
            sources=sources,
            session_id=session_id,
            execution_time_seconds=round(elapsed, 3),
            model_used=model or self.ollama_service.default_model,
            is_safe=True,
            context_found=True
        )

    def answer_query_stream(
        self,
        query: str,
        session_id: str = "default",
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        top_k: Optional[int] = None
    ) -> Tuple[Generator[str, None, None], List[SourceDocument]]:
        """Stream RAG response tokens with pre-retrieved sources."""
        sources = self.vector_store.search(query=query, top_k=top_k or 4)

        if not sources:
            def empty_generator():
                yield FALLBACK_NOT_FOUND_MESSAGE
            return empty_generator(), []

        context_blocks = []
        for idx, src in enumerate(sources):
            header = f"[Source {idx+1}: {src.book_name} | {src.chapter} (Page {src.page})]"
            context_blocks.append(f"{header}\n{src.content}")

        formatted_context = "\n\n---\n\n".join(context_blocks)
        prompt = SYSTEM_RAG_PROMPT.format(
            context=formatted_context,
            question=query
        )

        token_generator = self.ollama_service.generate_stream(
            prompt=prompt,
            model=model,
            temperature=temperature
        )

        return token_generator, sources
