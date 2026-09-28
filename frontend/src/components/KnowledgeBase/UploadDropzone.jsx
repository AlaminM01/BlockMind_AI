import React, { useState, useRef } from 'react';
import { UploadCloud, FileUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import * as api from '../../services/api';

const UploadDropzone = ({ onUploadSuccess }) => {
  const { showToast, refreshDocuments, refreshHealth } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const validExtensions = ['.pdf', '.md', '.txt', '.markdown'];
    const hasValidExt = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt) {
      showToast('Unsupported file type. Please upload a PDF, Markdown, or TXT file.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const res = await api.uploadDocument(file);
      showToast(`Successfully indexed "${file.name}" into ${res.chunk_count} chunks!`, 'success');
      await refreshDocuments();
      await refreshHealth();
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error('Upload error', err);
      showToast('Failed to upload and index document.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`
        cursor-pointer relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 backdrop-blur-xl
        ${
          isDragging
            ? 'border-cyan-400 bg-cyan-500/10 shadow-glow-cyan'
            : 'border-white/15 hover:border-cyan-500/50 bg-slate-900/60 hover:bg-slate-900/80'
        }
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        accept=".pdf,.md,.txt,.markdown"
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-glow-cyan">
          {isUploading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <UploadCloud className="w-8 h-8" />
          )}
        </div>

        <div>
          <h4 className="text-base font-bold text-white mb-1">
            {isUploading ? 'Chunking & Indexing Document...' : 'Upload Blockchain Book / Whitepaper'}
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Drag and drop your PDF, Markdown, or TXT file here, or click to browse.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-cyan-500/20">
            PDF
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-purple-500/20">
            Markdown (.md)
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-emerald-500/20">
            Text (.txt)
          </span>
        </div>
      </div>
    </div>
  );
};

export default UploadDropzone;
