import React, { useState } from 'react';
import { Bookmark, Search, Trash2, Copy, Check, BookOpen, Tag } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import * as api from '../../services/api';

const BookmarksView = () => {
  const { bookmarks, refreshBookmarks, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [copiedId, setCopiedId] = useState(null);

  const tags = ['All', 'Blockchain', 'Bitcoin', 'Ethereum', 'DeFi', 'Consensus', 'RAG'];

  const filteredBookmarks = bookmarks.filter((bm) => {
    const matchesSearch =
      bm.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bm.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag =
      selectedTag === 'All' ||
      (bm.tags && bm.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase()));
    return matchesSearch && matchesTag;
  });

  const handleDelete = async (id) => {
    try {
      await api.deleteBookmark(id);
      await refreshBookmarks();
      showToast('Bookmark removed', 'info');
    } catch (e) {
      showToast('Failed to delete bookmark', 'error');
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Answer copied to clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/20 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-primary shadow-glow-cyan">
            <Bookmark className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Saved Blockchain Answers
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Personal research library of bookmarked answers and verified source citations.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-800 text-cyan-400 border border-cyan-500/20">
          {bookmarks.length} Saved Answers
        </span>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search saved questions and answers..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/80 border border-white/5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/40"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${
                  selectedTag === t
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-white/5'
                }
              `}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Bookmarks List */}
      <div className="space-y-4">
        {filteredBookmarks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-white/5 space-y-3">
            <Bookmark className="w-8 h-8 mx-auto text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-300">No saved answers found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click the bookmark icon on any AI Chat answer to save it to your personal blockchain knowledge vault.
            </p>
          </div>
        ) : (
          filteredBookmarks.map((bm) => (
            <div
              key={bm.id}
              className="p-6 rounded-2xl bg-slate-900/70 border border-white/10 hover:border-cyan-500/30 backdrop-blur-xl shadow-xl transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    Question
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5">{bm.query}</h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(bm.id, bm.answer)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Copy Answer"
                  >
                    {copiedId === bm.id ? (
                      <Check className="w-4 h-4 text-accent" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(bm.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Answer Content */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 markdown-body text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {bm.answer}
              </div>

              {/* Sources footer */}
              {bm.sources && bm.sources.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mr-2">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    <span>Cited Sources:</span>
                  </div>
                  {bm.sources.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-800 font-mono text-[11px] text-cyan-300 border border-cyan-500/20"
                    >
                      {s.book_name} ({s.chapter})
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BookmarksView;
