from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class SourceDocument(BaseModel):
    id: str
    book_name: str
    chapter: Optional[str] = "General"
    page: Optional[int] = 1
    content: str
    similarity_score: float = Field(..., description="Cosine similarity score (0.0 - 1.0)")
    metadata: Optional[Dict[str, Any]] = None

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, description="The user's blockchain question")
    session_id: Optional[str] = Field("default", description="Conversation session ID")
    model: Optional[str] = Field(None, description="Ollama model override")
    temperature: Optional[float] = Field(None, description="LLM sampling temperature")
    top_k: Optional[int] = Field(None, description="Number of context chunks to retrieve")

class QueryResponse(BaseModel):
    answer: str
    query: str
    sources: List[SourceDocument]
    session_id: str
    execution_time_seconds: float
    model_used: str
    is_safe: bool = True
    context_found: bool = True

class ChatMessage(BaseModel):
    id: str
    session_id: str
    role: str = Field(..., description="'user' or 'assistant'")
    content: str
    timestamp: str
    sources: Optional[List[SourceDocument]] = None
    model: Optional[str] = None
    bookmarked: Optional[bool] = False

class DocumentInfo(BaseModel):
    id: str
    filename: str
    title: str
    author: Optional[str] = "Unknown"
    category: Optional[str] = "Blockchain"
    file_size_bytes: int
    file_size_formatted: str
    file_type: str
    chunk_count: int
    created_at: str
    indexed: bool = True

class DocumentListResponse(BaseModel):
    total_documents: int
    total_chunks: int
    documents: List[DocumentInfo]

class BookmarkItem(BaseModel):
    id: str
    query: str
    answer: str
    sources: List[SourceDocument]
    timestamp: str
    tags: Optional[List[str]] = []
    notes: Optional[str] = None

class StorageMetrics(BaseModel):
    documents_size_bytes: int
    documents_size_formatted: str
    vectorstore_size_bytes: int
    vectorstore_size_formatted: str
    total_storage_formatted: str

class AnalyticsData(BaseModel):
    total_books: int
    total_chunks: int
    total_questions_asked: int
    recent_searches: List[Dict[str, Any]]
    storage: StorageMetrics
    topic_distribution: Dict[str, int]
    avg_similarity_score: float

class SettingsConfig(BaseModel):
    ollama_base_url: str
    ollama_model: str
    temperature: float
    top_p: float
    chunk_size: int
    chunk_overlap: int
    similarity_top_k: int
    similarity_score_threshold: float
    available_models: List[str] = []

class HealthStatus(BaseModel):
    status: str
    app_name: str
    version: str
    ollama_connected: bool
    active_model: str
    vector_store_ready: bool
    indexed_documents: int
    indexed_chunks: int

class ReindexResponse(BaseModel):
    success: bool
    message: str
    total_documents_processed: int
    total_chunks_created: int
    duration_seconds: float
