import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
from backend.config import ANALYTICS_FILE, DOCUMENTS_DIR, VECTORSTORE_DIR
from backend.models.schemas import AnalyticsData, StorageMetrics
from backend.utils.file_utils import format_file_size
from backend.utils.logger import setup_logger

logger = setup_logger("AnalyticsService")

class AnalyticsService:
    """
    Collects and calculates live telemetry for the BlockMind AI Dashboard.
    """
    def __init__(self, file_path: Path = ANALYTICS_FILE):
        self.file_path = Path(file_path)
        self.data: Dict[str, Any] = {
            "total_questions_asked": 0,
            "recent_searches": [],
            "topic_distribution": {
                "Bitcoin & PoW": 0,
                "Ethereum & EVM": 0,
                "Consensus Mechanisms": 0,
                "DeFi & AMMs": 0,
                "Layer 2 & Rollups": 0,
                "General Blockchain": 0
            },
            "similarity_scores": []
        }
        self.load()

    def record_query(self, query: str, top_score: float, topic: str = "General Blockchain"):
        """Record search metrics for telemetry and dashboard reporting."""
        self.data["total_questions_asked"] += 1
        
        # Classify topic if default
        classified_topic = self._classify_topic(query) if topic == "General Blockchain" else topic
        self.data["topic_distribution"][classified_topic] = self.data["topic_distribution"].get(classified_topic, 0) + 1

        if top_score > 0:
            self.data["similarity_scores"].append(top_score)
            if len(self.data["similarity_scores"]) > 100:
                self.data["similarity_scores"] = self.data["similarity_scores"][-100:]

        search_entry = {
            "query": query,
            "score": round(top_score, 4),
            "topic": classified_topic,
            "timestamp": datetime.now().isoformat()
        }

        self.data["recent_searches"].insert(0, search_entry)
        if len(self.data["recent_searches"]) > 20:
            self.data["recent_searches"] = self.data["recent_searches"][:20]

        self.save()

    def get_analytics(self, total_books: int, total_chunks: int) -> AnalyticsData:
        """Compute full dashboard analytics data."""
        docs_bytes = self._get_dir_size(DOCUMENTS_DIR)
        vector_bytes = self._get_dir_size(VECTORSTORE_DIR)
        total_bytes = docs_bytes + vector_bytes

        avg_score = 0.0
        if self.data["similarity_scores"]:
            avg_score = round(sum(self.data["similarity_scores"]) / len(self.data["similarity_scores"]), 3)

        storage = StorageMetrics(
            documents_size_bytes=docs_bytes,
            documents_size_formatted=format_file_size(docs_bytes),
            vectorstore_size_bytes=vector_bytes,
            vectorstore_size_formatted=format_file_size(vector_bytes),
            total_storage_formatted=format_file_size(total_bytes)
        )

        return AnalyticsData(
            total_books=total_books,
            total_chunks=total_chunks,
            total_questions_asked=self.data["total_questions_asked"],
            recent_searches=self.data["recent_searches"],
            storage=storage,
            topic_distribution=self.data["topic_distribution"],
            avg_similarity_score=avg_score
        )

    def _get_dir_size(self, path: Path) -> int:
        """Calculate total directory size in bytes."""
        if not path.exists():
            return 0
        total = 0
        for entry in path.rglob("*"):
            if entry.is_file():
                try:
                    total += entry.stat().st_size
                except Exception:
                    pass
        return total

    def _classify_topic(self, query: str) -> str:
        q = query.lower()
        if any(w in q for w in ["bitcoin", "satoshi", "nakamoto", "halving", "utxo", "sha256"]):
            return "Bitcoin & PoW"
        elif any(w in q for w in ["ethereum", "evm", "solidity", "erc-20", "erc-721", "gas", "eip"]):
            return "Ethereum & EVM"
        elif any(w in q for w in ["consensus", "pos", "pow", "byzantine", "validator", "slashing", "tendermint"]):
            return "Consensus Mechanisms"
        elif any(w in q for w in ["defi", "amm", "uniswap", "liquidity", "flash loan", "aave", "oracle", "stablecoin"]):
            return "DeFi & AMMs"
        elif any(w in q for w in ["layer 2", "rollup", "zk", "snark", "stark", "optimism", "arbitrum", "blob"]):
            return "Layer 2 & Rollups"
        return "General Blockchain"

    def save(self):
        try:
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save analytics: {e}")

    def load(self):
        if not self.file_path.exists():
            return
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                saved = json.load(f)
                self.data.update(saved)
        except Exception as e:
            logger.error(f"Failed to load analytics: {e}")
