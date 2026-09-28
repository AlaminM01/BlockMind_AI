import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Layers,
  HardDrive,
  RefreshCw,
  Trash2,
  Eye,
  FileText,
  CheckCircle2,
  Database,
  PlusCircle,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import UploadDropzone from './UploadDropzone';
import DocumentPreviewModal from './DocumentPreviewModal';
import * as api from '../../services/api';

const DocumentManager = () => {
  const {
    documents,
    totalChunks,
    isDocsLoading,
    refreshDocuments,
    refreshHealth,
    showToast,
  } = useApp();

  const [isReindexing, setIsReindexing] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const handleReindex = async () => {
    setIsReindexing(true);
    try {
      const res = await api.reindexDocuments();
      showToast(res.message || 'Knowledge Base successfully reindexed!', 'success');
      await refreshDocuments();
      await refreshHealth();
    } catch (err) {
      showToast('Reindexing failed', 'error');
    } finally {
      setIsReindexing(false);
    }
  };

  const handleDelete = async (docId, filename) => {
    if (window.confirm(`Are you sure you want to delete "${filename}" from the Knowledge Base?`)) {
      try {
        await api.deleteDocument(docId);
        showToast(`"${filename}" deleted and vector store updated.`, 'info');
        await refreshDocuments();
        await refreshHealth();
      } catch (err) {
        showToast('Failed to delete document', 'error');
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/20 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-primary shadow-glow-cyan">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Blockchain Knowledge Base
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                FAISS Local Store
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Manage, upload, preview, and re-index the 5 core blockchain books and whitepapers.
            </p>
          </div>
        </div>

        {/* Reindex Button */}
        <button
          onClick={handleReindex}
          disabled={isReindexing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isReindexing ? 'animate-spin' : ''}`} />
          <span>{isReindexing ? 'Rebuilding Index...' : 'Re-index Vector Store'}</span>
        </button>
      </div>

      {/* Upload Dropzone */}
      <UploadDropzone />

      {/* Indexed Documents Table */}
      <div className="rounded-2xl bg-slate-900/70 border border-white/10 overflow-hidden backdrop-blur-xl shadow-xl">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-white">Indexed Documents & Books</h3>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            {documents.length} Documents • {totalChunks} Total Chunks
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 font-mono border-b border-white/5 uppercase">
              <tr>
                <th className="py-3 px-6">Document Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Chunks</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No documents currently indexed. Drop a PDF or Markdown file above.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 border border-white/5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-white text-xs sm:text-sm">{doc.title}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{doc.filename}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-[11px] text-purple-300 border border-purple-500/20 uppercase">
                        {doc.file_type}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-cyan-400 font-semibold">
                      {doc.chunk_count} chunks
                    </td>
                    <td className="py-4 px-4 text-slate-400 font-mono">
                      {doc.file_size_formatted}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[11px] border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Indexed
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
                          title="Preview Text"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id, doc.filename)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete from Vector Store"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        docId={previewDoc?.id}
        docTitle={previewDoc?.title}
      />
    </div>
  );
};

export default DocumentManager;
