import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from backend.config import HISTORY_FILE
from backend.models.schemas import ChatMessage, SourceDocument
from backend.utils.logger import setup_logger

logger = setup_logger("ChatHistoryService")

class ChatHistoryService:
    """
    Manages persistent local chat history and sessions.
    """
    def __init__(self, file_path: Path = HISTORY_FILE):
        self.file_path = Path(file_path)
        self.history: Dict[str, List[Dict[str, Any]]] = {}
        self.load()

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        sources: Optional[List[SourceDocument]] = None,
        model: Optional[str] = None
    ) -> ChatMessage:
        """Add a new chat message to a session."""
        if session_id not in self.history:
            self.history[session_id] = []

        msg_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        msg_dict = {
            "id": msg_id,
            "session_id": session_id,
            "role": role,
            "content": content,
            "timestamp": timestamp,
            "sources": [s.model_dump() for s in sources] if sources else [],
            "model": model,
            "bookmarked": False
        }

        self.history[session_id].append(msg_dict)
        self.save()

        return ChatMessage(
            id=msg_id,
            session_id=session_id,
            role=role,
            content=content,
            timestamp=timestamp,
            sources=sources,
            model=model,
            bookmarked=False
        )

    def get_session_messages(self, session_id: str) -> List[ChatMessage]:
        """Get all messages for a specific conversation session."""
        raw_msgs = self.history.get(session_id, [])
        result = []
        for m in raw_msgs:
            sources = [SourceDocument(**s) for s in m.get("sources", [])]
            result.append(
                ChatMessage(
                    id=m["id"],
                    session_id=m["session_id"],
                    role=m["role"],
                    content=m["content"],
                    timestamp=m["timestamp"],
                    sources=sources,
                    model=m.get("model"),
                    bookmarked=m.get("bookmarked", False)
                )
            )
        return result

    def get_all_sessions(self) -> List[Dict[str, Any]]:
        """List all active conversation sessions with previews."""
        sessions = []
        for s_id, msgs in self.history.items():
            if not msgs:
                continue
            first_user_msg = next((m["content"] for m in msgs if m["role"] == "user"), "New Chat")
            sessions.append({
                "session_id": s_id,
                "title": first_user_msg[:40] + ("..." if len(first_user_msg) > 40 else ""),
                "message_count": len(msgs),
                "last_active": msgs[-1]["timestamp"] if msgs else datetime.now().isoformat()
            })
        sessions.sort(key=lambda x: x["last_active"], reverse=True)
        return sessions

    def clear_session(self, session_id: str):
        """Clear all messages in a session."""
        if session_id in self.history:
            del self.history[session_id]
            self.save()

    def clear_all(self):
        """Clear entire chat history across all sessions."""
        self.history = {}
        self.save()

    def save(self):
        try:
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(self.history, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Failed to save chat history: {e}")

    def load(self):
        if not self.file_path.exists():
            return
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                self.history = json.load(f)
        except Exception as e:
            logger.error(f"Failed to load chat history: {e}")
            self.history = {}
