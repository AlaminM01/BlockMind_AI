import os
import time
import uuid
import json
from pathlib import Path
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse

from backend.config import (
    HOST, PORT, DEBUG,
    DOCUMENTS_DIR, VECTORSTORE_DIR,
    OLLAMA_BASE_URL, OLLAMA_MODEL,
    CHUNK_SIZE, CHUNK_OVERLAP,
    SIMILARITY_TOP_K, SIMILARITY_SCORE_THRESHOLD
)
from backend.models.schemas import (
    QueryRequest, QueryResponse, DocumentInfo,
    DocumentListResponse, BookmarkItem, AnalyticsData,
    SettingsConfig, HealthStatus, ReindexResponse, ChatMessage
)
from backend.rag.embeddings import LocalEmbeddingEngine
from backend.rag.document_processor import DocumentProcessor
from backend.rag.vectorstore import FAISSVectorStore
from backend.rag.rag_chain import RAGPipeline
from backend.services.ollama_service import OllamaService
from backend.services.chat_history_service import ChatHistoryService
from backend.services.bookmark_service import BookmarkService
from backend.services.analytics_service import AnalyticsService
from backend.utils.logger import setup_logger
from backend.utils.file_utils import (
    format_file_size,
    sanitize_filename,
    calculate_file_hash,
    read_file_safe
)

logger = setup_logger("App")

# Global Service Instances
embedding_engine = LocalEmbeddingEngine()
vector_store = FAISSVectorStore(embedding_engine=embedding_engine)
document_processor = DocumentProcessor(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)
ollama_service = OllamaService(base_url=OLLAMA_BASE_URL, default_model=OLLAMA_MODEL)
rag_pipeline = RAGPipeline(vector_store=vector_store, ollama_service=ollama_service)
history_service = ChatHistoryService()
bookmark_service = BookmarkService()
analytics_service = AnalyticsService()

def index_all_existing_documents():
    """Index all documents located in data/documents upon initialization if vectorstore is empty."""
    if vector_store.total_chunks > 0:
        logger.info(f"Vector store already contains {vector_store.total_chunks} chunks.")
        return

    logger.info("Initializing vector store from backend/data/documents...")
    doc_files = list(DOCUMENTS_DIR.glob("*.*"))
    doc_files = [f for f in doc_files if f.suffix.lower() in [".pdf", ".md", ".txt", ".markdown"]]
    
    total_chunks = 0
    for file_path in doc_files:
        doc_id = file_path.stem
        chunks = document_processor.process_file(file_path, doc_id)
        if chunks:
            vector_store.add_chunks(chunks)
            total_chunks += len(chunks)

    logger.info(f"Initial indexing complete: Processed {len(doc_files)} files into {total_chunks} chunks.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting BlockMind AI Backend Service...")
    index_all_existing_documents()
    yield
    # Shutdown
    logger.info("Shutting down BlockMind AI Backend Service...")

app = FastAPI(
    title="BlockMind AI API",
    description="100% Free and Offline Blockchain Knowledge Assistant powered by RAG and FAISS",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- SYSTEM & HEALTH ENDPOINTS -----------------

@app.get("/api/health", response_model=HealthStatus)
def get_health_status():
    doc_files = [f for f in DOCUMENTS_DIR.glob("*.*") if f.suffix.lower() in [".pdf", ".md", ".txt", ".markdown"]]
    return HealthStatus(
        status="healthy",
        app_name="BlockMind AI",
        version="1.0.0",
        ollama_connected=ollama_service.is_available(),
        active_model=ollama_service.default_model,
        vector_store_ready=vector_store.total_chunks > 0,
        indexed_documents=len(doc_files),
        indexed_chunks=vector_store.total_chunks
    )

# ----------------- RAG CHAT & STREAMING -----------------

@app.post("/api/chat", response_model=QueryResponse)
def chat_query(request: QueryRequest):
    """Execute non-streaming RAG query and record history & telemetry."""
    # Record user message in history
    history_service.add_message(
        session_id=request.session_id or "default",
        role="user",
        content=request.query
    )

    response = rag_pipeline.answer_query(
        query=request.query,
        session_id=request.session_id or "default",
        model=request.model,
        temperature=request.temperature,
        top_k=request.top_k
    )

    # Record assistant message in history
    history_service.add_message(
        session_id=request.session_id or "default",
        role="assistant",
        content=response.answer,
        sources=response.sources,
        model=response.model_used
    )

    # Telemetry
    top_score = response.sources[0].similarity_score if response.sources else 0.0
    analytics_service.record_query(query=request.query, top_score=top_score)

    return response

@app.get("/api/chat/stream")
def chat_stream(
    query: str = Query(..., description="User query"),
    session_id: str = Query("default", description="Session ID"),
    model: Optional[str] = Query(None),
    temperature: Optional[float] = Query(None),
    top_k: Optional[int] = Query(None)
):
    """Server-Sent Events (SSE) streaming RAG response."""
    history_service.add_message(session_id=session_id, role="user", content=query)
    
    token_gen, sources = rag_pipeline.answer_query_stream(
        query=query,
        session_id=session_id,
        model=model,
        temperature=temperature,
        top_k=top_k
    )

    def event_stream():
        full_response = []
        # First send sources metadata as an initial SSE event
        sources_payload = [s.model_dump() for s in sources]
        yield f"data: {json.dumps({'type': 'sources', 'sources': sources_payload})}\n\n"

        for token in token_gen:
            full_response.append(token)
            yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"

        complete_text = "".join(full_response)
        history_service.add_message(
            session_id=session_id,
            role="assistant",
            content=complete_text,
            sources=sources,
            model=model or ollama_service.default_model
        )
        
        top_score = sources[0].similarity_score if sources else 0.0
        analytics_service.record_query(query=query, top_score=top_score)

        yield f"data: {json.dumps({'type': 'done', 'answer': complete_text})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")

# ----------------- SESSIONS & HISTORY -----------------

@app.get("/api/sessions")
def list_sessions():
    return history_service.get_all_sessions()

@app.get("/api/sessions/{session_id}", response_model=List[ChatMessage])
def get_session_messages(session_id: str):
    return history_service.get_session_messages(session_id)

@app.delete("/api/sessions/{session_id}")
def clear_session(session_id: str):
    history_service.clear_session(session_id)
    return {"success": True, "message": f"Session {session_id} deleted"}

@app.delete("/api/sessions")
def clear_all_sessions():
    history_service.clear_all()
    return {"success": True, "message": "All chat history cleared"}

# ----------------- KNOWLEDGE BASE & DOCUMENTS -----------------

@app.get("/api/documents", response_model=DocumentListResponse)
def list_documents():
    doc_files = [f for f in DOCUMENTS_DIR.glob("*.*") if f.suffix.lower() in [".pdf", ".md", ".txt", ".markdown"]]
    docs = []
    total_chunks = 0

    for f in doc_files:
        doc_id = f.stem
        # Count chunks belonging to this document
        matching_chunks = [c for c in vector_store.chunks_metadata if c.get("doc_id") == doc_id or c.get("metadata", {}).get("doc_id") == doc_id]
        chunk_count = len(matching_chunks)
        total_chunks += chunk_count
        stat = f.stat()

        docs.append(
            DocumentInfo(
                id=doc_id,
                filename=f.name,
                title=f.name.replace("_", " ").replace("-", " ").rsplit(".", 1)[0].title(),
                file_size_bytes=stat.st_size,
                file_size_formatted=format_file_size(stat.st_size),
                file_type=f.suffix.lower().lstrip("."),
                chunk_count=chunk_count,
                created_at=time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(stat.st_ctime)),
                indexed=chunk_count > 0
            )
        )

    return DocumentListResponse(
        total_documents=len(docs),
        total_chunks=vector_store.total_chunks,
        documents=docs
    )

@app.post("/api/documents/upload", response_model=DocumentInfo)
async def upload_document(file: UploadFile = File(...)):
    """Upload and index a PDF, Markdown, or TXT file into FAISS."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing")

    ext = Path(file.filename).suffix.lower()
    if ext not in [".pdf", ".md", ".txt", ".markdown"]:
        raise HTTPException(status_code=400, detail="Only PDF, TXT, and Markdown files are supported.")

    clean_name = sanitize_filename(file.filename)
    target_path = DOCUMENTS_DIR / clean_name
    
    # Save file contents
    contents = await file.read()
    with open(target_path, "wb") as f:
        f.write(contents)

    doc_id = target_path.stem
    # Remove existing chunks for this doc if it was re-uploaded
    vector_store.remove_document(doc_id)

    # Process and add to vector store
    chunks = document_processor.process_file(target_path, doc_id)
    if chunks:
        vector_store.add_chunks(chunks)

    stat = target_path.stat()
    return DocumentInfo(
        id=doc_id,
        filename=clean_name,
        title=clean_name.replace("_", " ").replace("-", " ").rsplit(".", 1)[0].title(),
        file_size_bytes=stat.st_size,
        file_size_formatted=format_file_size(stat.st_size),
        file_type=ext.lstrip("."),
        chunk_count=len(chunks),
        created_at=time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(stat.st_ctime)),
        indexed=len(chunks) > 0
    )

@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: str):
    """Delete a document file and remove its vectors from FAISS."""
    matching_files = [f for f in DOCUMENTS_DIR.glob("*.*") if f.stem == doc_id]
    for f in matching_files:
        try:
            f.unlink()
        except Exception as e:
            logger.error(f"Error removing file {f}: {e}")

    removed_chunks = vector_store.remove_document(doc_id)
    return {
        "success": True,
        "message": f"Document {doc_id} deleted successfully.",
        "removed_chunks": removed_chunks
    }

@app.post("/api/documents/reindex", response_model=ReindexResponse)
def reindex_all():
    """Wipe and re-index all documents from scratch."""
    start_time = time.time()
    vector_store.clear()

    doc_files = [f for f in DOCUMENTS_DIR.glob("*.*") if f.suffix.lower() in [".pdf", ".md", ".txt", ".markdown"]]
    total_chunks = 0

    for file_path in doc_files:
        doc_id = file_path.stem
        chunks = document_processor.process_file(file_path, doc_id)
        if chunks:
            vector_store.add_chunks(chunks)
            total_chunks += len(chunks)

    duration = time.time() - start_time
    return ReindexResponse(
        success=True,
        message=f"Reindexed {len(doc_files)} documents into {total_chunks} chunks.",
        total_documents_processed=len(doc_files),
        total_chunks_created=total_chunks,
        duration_seconds=round(duration, 3)
    )

@app.get("/api/documents/preview/{doc_id}")
def preview_document(doc_id: str):
    """Fetch raw text preview of a document."""
    matching_files = [f for f in DOCUMENTS_DIR.glob("*.*") if f.stem == doc_id]
    if not matching_files:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = matching_files[0]
    content = read_file_safe(file_path)
    return {
        "id": doc_id,
        "filename": file_path.name,
        "content_preview": content[:4000] + ("..." if len(content) > 4000 else ""),
        "total_chars": len(content)
    }

# ----------------- BOOKMARKS -----------------

@app.get("/api/bookmarks", response_model=List[BookmarkItem])
def get_bookmarks(tag: Optional[str] = None, search: Optional[str] = None):
    return bookmark_service.get_all(tag_filter=tag, search_query=search)

@app.post("/api/bookmarks", response_model=BookmarkItem)
def create_bookmark(item: BookmarkItem):
    return bookmark_service.add_bookmark(
        query=item.query,
        answer=item.answer,
        sources=item.sources,
        tags=item.tags,
        notes=item.notes
    )

@app.delete("/api/bookmarks/{bookmark_id}")
def delete_bookmark(bookmark_id: str):
    success = bookmark_service.remove_bookmark(bookmark_id)
    if not success:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return {"success": True, "message": "Bookmark removed"}

# ----------------- ANALYTICS & DASHBOARD -----------------

@app.get("/api/analytics", response_model=AnalyticsData)
def get_dashboard_analytics():
    doc_files = [f for f in DOCUMENTS_DIR.glob("*.*") if f.suffix.lower() in [".pdf", ".md", ".txt", ".markdown"]]
    return analytics_service.get_analytics(
        total_books=len(doc_files),
        total_chunks=vector_store.total_chunks
    )

# ----------------- SETTINGS -----------------

@app.get("/api/settings", response_model=SettingsConfig)
def get_settings():
    models = ollama_service.get_available_models()
    return SettingsConfig(
        ollama_base_url=ollama_service.base_url,
        ollama_model=ollama_service.default_model,
        temperature=0.2,
        top_p=0.9,
        chunk_size=document_processor.chunk_size,
        chunk_overlap=document_processor.chunk_overlap,
        similarity_top_k=SIMILARITY_TOP_K,
        similarity_score_threshold=SIMILARITY_SCORE_THRESHOLD,
        available_models=models
    )

@app.post("/api/settings")
def update_settings(settings: SettingsConfig):
    ollama_service.base_url = settings.ollama_base_url
    ollama_service.default_model = settings.ollama_model
    document_processor.chunk_size = settings.chunk_size
    document_processor.chunk_overlap = settings.chunk_overlap
    return {"success": True, "message": "Settings updated successfully"}

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting BlockMind AI on http://{HOST}:{PORT}")
    uvicorn.run("app:app", host=HOST, port=PORT, reload=DEBUG)
