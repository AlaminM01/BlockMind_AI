import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Layers, Award, FileText, CheckCircle2, Copy, Check, Quote } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const SourceModal = ({ isOpen, onClose, sources }) => {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('passages'); // 'passages' | 'citations'
  const [copiedFormat, setCopiedFormat] = useState(null);

  if (!isOpen || !sources || sources.length === 0) return null;

  const generateCitation = (src, format) => {
    const bookTitle = src.book_name || 'Blockchain Knowledge Base';
    const chapter = src.chapter || 'Technical Specifications';
    const year = '2024';

    if (format === 'bibtex') {
      const citeKey = bookTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15) + year;
      return `@incollection{${citeKey},
  title     = {${chapter}},
  booktitle = {${bookTitle}},
  year      = {${year}},
  publisher = {Decentralized Knowledge Foundation},
  note      = {Indexed in BlockMind AI Offline Knowledge Base}
}`;
    }

    if (format === 'apa') {
      return `BlockMind AI. (${year}). ${chapter}. In ${bookTitle}. Decentralized Knowledge Repository.`;
    }

    if (format === 'ieee') {
      return `[1] "${chapter}," in ${bookTitle}, Decentralized Knowledge Repository, ${year}, sec. ${chapter}.`;
    }

    return '';
  };

  const copyCitation = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(key);
    showToast('Citation copied to clipboard', 'success');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

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
                <h3 className="text-base font-bold text-white">Retrieved RAG Grounding Sources</h3>
                <p className="text-xs text-slate-400">
                  {sources.length} matching document chunks retrieved via Hybrid FAISS + BM25
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

          {/* Tab Selector */}
          <div className="flex items-center gap-2 px-6 pt-3 border-b border-white/5 bg-slate-900/60">
            <button
              onClick={() => setActiveTab('passages')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'passages'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Book Passages ({sources.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('citations')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'citations'
                  ? 'border-purple-400 text-purple-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Quote className="w-3.5 h-3.5" />
              <span>Academic Citations (BibTeX / APA / IEEE)</span>
            </button>
          </div>

          {/* Sources Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeTab === 'passages' && (
              <>
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
              </>
            )}

            {activeTab === 'citations' && (
              <div className="space-y-6">
                {sources.map((src, idx) => {
                  const bibtex = generateCitation(src, 'bibtex');
                  const apa = generateCitation(src, 'apa');
                  const ieee = generateCitation(src, 'ieee');

                  return (
                    <div key={idx} className="p-4 rounded-xl bg-slate-800/40 border border-white/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-cyan-300">
                          [{idx + 1}] {src.book_name} — {src.chapter}
                        </h4>
                      </div>

                      {/* BibTeX */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                          <span>BibTeX Format:</span>
                          <button
                            onClick={() => copyCitation(bibtex, `bib_${idx}`)}
                            className="flex items-center gap-1 text-purple-300 hover:text-purple-200"
                          >
                            {copiedFormat === `bib_${idx}` ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedFormat === `bib_${idx}` ? 'Copied' : 'Copy BibTeX'}</span>
                          </button>
                        </div>
                        <pre className="p-2.5 rounded-lg bg-slate-950/80 font-mono text-[11px] text-slate-300 overflow-x-auto border border-white/5">
                          {bibtex}
                        </pre>
                      </div>

                      {/* APA */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                          <span>APA 7th Format:</span>
                          <button
                            onClick={() => copyCitation(apa, `apa_${idx}`)}
                            className="flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
                          >
                            {copiedFormat === `apa_${idx}` ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedFormat === `apa_${idx}` ? 'Copied' : 'Copy APA'}</span>
                          </button>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950/80 font-mono text-[11px] text-slate-300 border border-white/5">
                          {apa}
                        </div>
                      </div>

                      {/* IEEE */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                          <span>IEEE Format:</span>
                          <button
                            onClick={() => copyCitation(ieee, `ieee_${idx}`)}
                            className="flex items-center gap-1 text-emerald-300 hover:text-emerald-200"
                          >
                            {copiedFormat === `ieee_${idx}` ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedFormat === `ieee_${idx}` ? 'Copied' : 'Copy IEEE'}</span>
                          </button>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950/80 font-mono text-[11px] text-slate-300 border border-white/5">
                          {ieee}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
