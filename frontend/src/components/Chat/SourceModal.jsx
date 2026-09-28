import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Layers, Award, FileText, CheckCircle2 } from 'lucide-react';

const SourceModal = ({ isOpen, onClose, sources }) => {
  if (!isOpen || !sources || sources.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-slate-900 border border-cyan-500/30 shadow-glow-cyan overflow-hidden text-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-primary border border-cyan-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Retrieved RAG Sources</h3>
                <p className="text-xs text-slate-400">
                  {sources.length} matching document chunks retrieved via FAISS Vector Database
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sources List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {sources.map((src, idx) => {
              const matchPercent = Math.round(src.similarity_score * 100);
              return (
                <div
                  key={src.id || idx}
                  className="p-4 rounded-xl bg-slate-800/40 border border-white/5 hover:border-cyan-500/30 transition-all duration-200"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center justify-center border border-cyan-500/30">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-semibold text-cyan-300">{src.book_name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 text-[11px] font-mono border border-purple-500/20">
                        {src.chapter}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-[11px] font-mono border border-emerald-500/20 flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {matchPercent}% Match
                      </span>
                    </div>
                  </div>

                  {/* Content snippet */}
                  <div className="mt-3 p-3 rounded-lg bg-slate-950/60 border border-white/5 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {src.content}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-white/10 bg-slate-800/40 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/40 transition-colors"
            >
              Close Inspector
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SourceModal;
