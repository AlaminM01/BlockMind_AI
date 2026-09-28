import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from backend.config import BOOKMARKS_FILE
from backend.models.schemas import BookmarkItem, SourceDocument
from backend.utils.logger import setup_logger

logger = setup_logger("BookmarkService")

class BookmarkService:
    """
    Manages user saved/bookmarked questions and answers with metadata & tags.
    """
    def __init__(self, file_path: Path = BOOKMARKS_FILE):
        self.file_path = Path(file_path)
        self.bookmarks: List[Dict[str, Any]] = []
        self.load()

    def add_bookmark(
        self,
        query: str,
        answer: str,
        sources: List[SourceDocument],
        tags: Optional[List[str]] = None,
        notes: Optional[str] = None
    ) -> BookmarkItem:
        """Add a QA pair to bookmarks."""
        bm_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()

        # Check if already bookmarked
        existing = next((b for b in self.bookmarks if b["query"].strip().lower() == query.strip().lower()), None)
        if existing:
            return BookmarkItem(
                id=existing["id"],
                query=existing["query"],
                answer=existing["answer"],
                sources=[SourceDocument(**s) for s in existing.get("sources", [])],
                timestamp=existing["timestamp"],
                tags=existing.get("tags", []),
                notes=existing.get("notes")
            )

        item = {
            "id": bm_id,
            "query": query,
            "answer": answer,
            "sources": [s.model_dump() for s in sources],
            "timestamp": timestamp,
            "tags": tags or ["Blockchain"],
            "notes": notes
        }
        self.bookmarks.insert(0, item)
        self.save()

        return BookmarkItem(
            id=bm_id,
            query=query,
            answer=answer,
            sources=sources,
            timestamp=timestamp,
            tags=tags or ["Blockchain"],
            notes=notes
        )

    def get_all(self, tag_filter: Optional[str] = None, search_query: Optional[str] = None) -> List[BookmarkItem]:
        """Fetch all bookmarks with optional filtering."""
        filtered = self.bookmarks
        if tag_filter and tag_filter != "All":
            filtered = [b for b in filtered if tag_filter.lower() in [t.lower() for t in b.get("tags", [])]]

        if search_query:
            q = search_query.lower()
            filtered = [
                b for b in filtered
                if q in b["query"].lower() or q in b["answer"].lower()
            ]

        results = []
        for b in filtered:
            sources = [SourceDocument(**s) for s in b.get("sources", [])]
            results.append(
                BookmarkItem(
                    id=b["id"],
                    query=b["query"],
                    answer=b["answer"],
                    sources=sources,
                    timestamp=b["timestamp"],
                    tags=b.get("tags", []),
                    notes=b.get("notes")
                )
            )
        return results

    def remove_bookmark(self, bookmark_id: str) -> bool:
        """Delete a bookmark by ID."""
        initial_len = len(self.bookmarks)
        self.bookmarks = [b for b in self.bookmarks if b["id"] != bookmark_id]
        if len(self.bookmarks) < initial_len:
            self.save()
            return True
        return False

    def save(self):
        try:
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(self.bookmarks, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Failed to save bookmarks: {e}")

    def load(self):
        if not self.file_path.exists():
            return
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                self.bookmarks = json.load(f)
        except Exception as e:
            logger.error(f"Failed to load bookmarks: {e}")
            self.bookmarks = []
