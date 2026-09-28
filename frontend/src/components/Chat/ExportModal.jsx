import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileDown, FileText, Code } from 'lucide-react';
import { exportChatToPDF, exportChatToMarkdown } from '../../utils/exportPdf';
import { useApp } from '../../context/AppContext';

const ExportModal = ({ isOpen, onClose, messages }) => {
  const { showToast } = useApp();

  if (!isOpen) return null;

  const handleExportPDF = () => {
    exportChatToPDF(messages);
    showToast('Exported conversation to PDF report', 'success');
    onClose();
  };

  const handleExportMarkdown = () => {
    exportChatToMarkdown(messages);
    showToast('Exported conversation to Markdown', 'success');
    onClose();
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(messages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `BlockMind_Chat_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported conversation to JSON', 'success');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-cyan-500/30 p-6 shadow-glow-cyan text-slate-200"
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <FileDown className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold text-white">Export Conversation</h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-3 mb-6">
            Choose your preferred export format for this session's Q&A and cited book sources.
          </p>

          <div className="space-y-3">
            {/* PDF Option */}
            <button
              onClick={handleExportPDF}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/40 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300">PDF Document</h4>
                  <p className="text-[11px] text-slate-400">Formatted print-ready research report</p>
                </div>
              </div>
              <span className="text-xs font-mono text-cyan-400">.pdf</span>
            </button>

            {/* Markdown Option */}
            <button
              onClick={handleExportMarkdown}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-white/10 hover:border-purple-500/40 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200 group-hover:text-purple-300">Markdown File</h4>
                  <p className="text-[11px] text-slate-400">Ideal for Obsidian, Notion, or GitHub</p>
                </div>
              </div>
              <span className="text-xs font-mono text-purple-400">.md</span>
            </button>

            {/* JSON Option */}
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-white/10 hover:border-accent/40 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10 text-accent group-hover:scale-110 transition-transform">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200 group-hover:text-accent">Raw JSON</h4>
                  <p className="text-[11px] text-slate-400">Structured data with full source metadata</p>
                </div>
              </div>
              <span className="text-xs font-mono text-accent">.json</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExportModal;
