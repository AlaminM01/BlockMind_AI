import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Loader2, BookOpen } from 'lucide-react';
import * as api from '../../services/api';

const DocumentPreviewModal = ({ isOpen, onClose, docId, docTitle }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && docId) {
      setLoading(true);
      api
        .previewDocument(docId)
        .then((res) => {
          setContent(res.content_preview || 'No content preview available.');
        })
        .catch(() => {
          setContent('Failed to load document preview.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, docId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl max-h-[80vh] flex flex-col rounded-2xl bg-slate-900 border border-cyan-500/30 p-6 shadow-glow-cyan text-slate-200"
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-primary border border-cyan-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{docTitle || 'Document Preview'}</h3>
                <p className="text-xs text-slate-400 font-mono">ID: {docId}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto my-4 p-4 rounded-xl bg-slate-950/70 border border-white/5 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              content
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DocumentPreviewModal;
