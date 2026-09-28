import hashlib
import re
from pathlib import Path
from typing import Union

def format_file_size(size_bytes: int) -> str:
    """Format byte size into human readable string."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.2f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"

def calculate_file_hash(file_path: Union[str, Path]) -> str:
    """Calculate SHA256 hash of a file for change detection and deduplication."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal and illegal characters."""
    filename = re.sub(r'[\\/*?:"<>|]', "", filename)
    filename = filename.replace(" ", "_")
    return filename.strip()

def get_file_extension(filename: str) -> str:
    """Extract clean lowercase file extension."""
    return Path(filename).suffix.lower().lstrip(".")

def read_file_safe(file_path: Union[str, Path]) -> str:
    """Read file content with automatic encoding detection fallback."""
    path = Path(file_path)
    for encoding in ["utf-8", "latin-1", "cp1252", "ascii"]:
        try:
            return path.read_text(encoding=encoding)
        except UnicodeDecodeError:
            continue
    return path.read_text(errors="ignore")
