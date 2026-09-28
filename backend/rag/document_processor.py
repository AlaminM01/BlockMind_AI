import re
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from backend.config import CHUNK_SIZE, CHUNK_OVERLAP
from backend.utils.logger import setup_logger
from backend.utils.file_utils import read_file_safe, format_file_size

logger = setup_logger("DocumentProcessor")

@dataclass
class DocumentChunk:
    id: str
    doc_id: str
    book_name: str
    chapter: str
    page: int
    content: str
    metadata: Dict[str, Any]

class DocumentProcessor:
    """
    Parses PDF, Markdown, and TXT blockchain documents.
    Splits text recursively into semantic chunks with chapter/page context.
    """
    def __init__(self, chunk_size: int = CHUNK_SIZE, chunk_overlap: int = CHUNK_OVERLAP):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def process_file(self, file_path: Path, doc_id: str) -> List[DocumentChunk]:
        """Process a single document file into structured chunks."""
        ext = file_path.suffix.lower()
        chunks = []

        if ext == ".pdf":
            chunks = self._process_pdf(file_path, doc_id)
        elif ext in [".md", ".markdown"]:
            chunks = self._process_markdown(file_path, doc_id)
        elif ext in [".txt", ".text"]:
            chunks = self._process_text(file_path, doc_id)
        else:
            logger.warning(f"Unsupported file format {ext} for {file_path.name}, falling back to plain text reader.")
            chunks = self._process_text(file_path, doc_id)

        logger.info(f"Processed {file_path.name} -> {len(chunks)} chunks.")
        return chunks

    def _process_pdf(self, file_path: Path, doc_id: str) -> List[DocumentChunk]:
        """Extract text page-by-page from PDF."""
        chunks = []
        book_name = self._clean_title_from_filename(file_path.name)
        
        try:
            from pypdf import PdfReader
            reader = PdfReader(str(file_path))
            total_pages = len(reader.pages)
            
            for page_idx, page in enumerate(reader.pages):
                page_number = page_idx + 1
                text = page.extract_text() or ""
                text = self._clean_text(text)
                if not text.strip():
                    continue

                page_chunks = self._split_text_into_chunks(text)
                for c_idx, content in enumerate(page_chunks):
                    chunk_id = f"{doc_id}_p{page_number}_c{c_idx+1}"
                    chapter = self._detect_chapter_title(content) or f"Page {page_number}"
                    chunks.append(
                        DocumentChunk(
                            id=chunk_id,
                            doc_id=doc_id,
                            book_name=book_name,
                            chapter=chapter,
                            page=page_number,
                            content=content,
                            metadata={
                                "total_pages": total_pages,
                                "filename": file_path.name,
                                "doc_id": doc_id
                            }
                        )
                    )
        except Exception as e:
            logger.error(f"Error parsing PDF {file_path.name}: {e}. Trying fallback text extraction.")
            return self._process_text(file_path, doc_id)

        return chunks

    def _process_markdown(self, file_path: Path, doc_id: str) -> List[DocumentChunk]:
        """Extract sections and chapters from Markdown."""
        text = read_file_safe(file_path)
        book_name = self._clean_title_from_filename(file_path.name)
        
        # Check for top-level Title in markdown
        title_match = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
        if title_match:
            book_name = title_match.group(1).strip()

        # Split markdown by top headers (## or #)
        sections = re.split(r"\n(?=##?\s+)", text)
        chunks = []
        chunk_counter = 0

        for section_idx, section in enumerate(sections):
            clean_section = self._clean_text(section)
            if not clean_section.strip():
                continue

            header_match = re.match(r"^##?\s+(.+)", clean_section)
            chapter_name = header_match.group(1).strip() if header_match else f"Section {section_idx + 1}"

            section_chunks = self._split_text_into_chunks(clean_section)
            for c_idx, content in enumerate(section_chunks):
                chunk_counter += 1
                chunk_id = f"{doc_id}_c{chunk_counter}"
                chunks.append(
                    DocumentChunk(
                        id=chunk_id,
                        doc_id=doc_id,
                        book_name=book_name,
                        chapter=chapter_name,
                        page=max(1, (chunk_counter // 3) + 1),
                        content=content,
                        metadata={
                            "filename": file_path.name,
                            "doc_id": doc_id,
                            "section_index": section_idx
                        }
                    )
                )

        return chunks

    def _process_text(self, file_path: Path, doc_id: str) -> List[DocumentChunk]:
        """Extract text chunks from plain text files."""
        text = read_file_safe(file_path)
        clean_text = self._clean_text(text)
        book_name = self._clean_title_from_filename(file_path.name)
        
        raw_chunks = self._split_text_into_chunks(clean_text)
        chunks = []

        for idx, content in enumerate(raw_chunks):
            chunk_id = f"{doc_id}_c{idx+1}"
            chapter = self._detect_chapter_title(content) or f"Section {idx+1}"
            chunks.append(
                DocumentChunk(
                    id=chunk_id,
                    doc_id=doc_id,
                    book_name=book_name,
                    chapter=chapter,
                    page=max(1, (idx // 3) + 1),
                    content=content,
                    metadata={
                        "filename": file_path.name,
                        "doc_id": doc_id
                    }
                )
            )

        return chunks

    def _split_text_into_chunks(self, text: str) -> List[str]:
        """Recursive chunking preserving paragraph and sentence boundaries."""
        if len(text) <= self.chunk_size:
            return [text] if text.strip() else []

        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = []
        current_length = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            para_len = len(para)
            if current_length + para_len + 2 <= self.chunk_size:
                current_chunk.append(para)
                current_length += para_len + 2
            else:
                if current_chunk:
                    chunks.append("\n\n".join(current_chunk))
                
                # If paragraph itself is bigger than chunk size, split by sentences
                if para_len > self.chunk_size:
                    sub_chunks = self._split_by_sentences(para)
                    chunks.extend(sub_chunks[:-1])
                    current_chunk = [sub_chunks[-1]] if sub_chunks else []
                    current_length = len(current_chunk[0]) if current_chunk else 0
                else:
                    current_chunk = [para]
                    current_length = para_len

        if current_chunk:
            chunks.append("\n\n".join(current_chunk))

        # Add overlap between chunks for smoother semantic continuity
        return self._add_chunk_overlap(chunks)

    def _split_by_sentences(self, text: str) -> List[str]:
        """Split oversized text by punctuation sentences."""
        sentences = re.split(r"(?<=[.!?])\s+", text)
        chunks = []
        curr = []
        curr_len = 0

        for s in sentences:
            if curr_len + len(s) <= self.chunk_size:
                curr.append(s)
                curr_len += len(s) + 1
            else:
                if curr:
                    chunks.append(" ".join(curr))
                curr = [s]
                curr_len = len(s)

        if curr:
            chunks.append(" ".join(curr))
        return chunks

    def _add_chunk_overlap(self, raw_chunks: List[str]) -> List[str]:
        """Ensure contextual overlap between consecutive chunks."""
        if len(raw_chunks) <= 1 or self.chunk_overlap <= 0:
            return raw_chunks

        overlapped = []
        for i, chunk in enumerate(raw_chunks):
            if i == 0:
                overlapped.append(chunk)
            else:
                prev = raw_chunks[i-1]
                overlap_text = prev[-self.chunk_overlap:] if len(prev) > self.chunk_overlap else prev
                # Break clean on word boundary
                if " " in overlap_text:
                    overlap_text = overlap_text[overlap_text.find(" "):].strip()
                overlapped.append(f"... {overlap_text} {chunk}")
        return overlapped

    def _detect_chapter_title(self, text: str) -> Optional[str]:
        match = re.search(r"(?:Chapter|Section|\bCh\.)\s*(\d+[\w\s:-]*)", text, re.IGNORECASE)
        if match:
            return match.group(0).strip().split("\n")[0][:40]
        return None

    def _clean_title_from_filename(self, filename: str) -> str:
        name = Path(filename).stem
        name = re.sub(r"^\d+[\s_-]*", "", name)
        name = name.replace("_", " ").replace("-", " ")
        return name.title()

    def _clean_text(self, text: str) -> str:
        text = re.sub(r"\r\n", "\n", text)
        text = re.sub(r"\t", " ", text)
        text = re.sub(r" +", " ", text)
        return text.strip()
