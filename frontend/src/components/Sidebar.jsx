import React from 'react';
import { PlusCircle, MessageSquare, Trash2, BookOpen, Layers, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/formatters';

const Sidebar = () => {
  const {
    sessions,
    sessionId,
    switchSession,
    startNewChat,
    systemHealth,
    refreshSessions,
    showToast,
    setActiveTab,
  } = useApp();

  const handleClearAll = async () => {
    if (window.confirm('Clear all conversation history?')) {
      const api = await import('../services/api');
      await api.clearAllSessions();
      await refreshSessions();
      startNewChat();
      showToast('All conversation history cleared', 'info');
    }
  };

  return (
    <aside className="w-72 flex-shrink-0 flex flex-col justify-between border-r border-white/10 dark:border-cyan-500/20 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-xl p-4 hidden md:flex h-[calc(100vh-4rem)]">
      
      {/* Top Action & Sessions List */}
      <div className="flex flex-col flex-1 overflow-hidden">
        
        {/* New Chat Button */}
        <button
          onClick={startNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-bold text-sm shadow-glow-cyan transition-all duration-200 transform active:scale-95 mb-4"
        >
          <PlusCircle className="w-4 h-4 text-slate-950" />
          <span>New Blockchain Chat</span>
        </button>

        {/* Sessions Header */}
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Recent Conversations
          </span>
          {sessions.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-slate-500 hover:text-rose-400 transition-colors"
              title="Clear all conversations"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sessions Scrollable List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40 text-cyan-400" />
              No conversations yet. Ask your first question!
            </div>
          ) : (
            sessions.map((sess) => {
              const isActive = sess.session_id === sessionId;
              return (
                <button
                  key={sess.session_id}
                  onClick={() => switchSession(sess.session_id)}
                  className={`
                    w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all duration-200 flex items-start gap-2.5
                    ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }
                  `}
                >
                  <MessageSquare className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-slate-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-medium text-slate-200">{sess.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{formatDate(sess.last_active)}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Knowledge Base Quick Card */}
      <div className="pt-4 border-t border-white/10 space-y-3">
        <div
          onClick={() => setActiveTab('knowledge')}
          className="cursor-pointer p-3 rounded-xl bg-slate-800/60 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Knowledge Base</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono">
              {systemHealth.indexed_documents} Books
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {systemHealth.indexed_chunks} semantic chunks indexed locally.
          </p>
        </div>

        {/* Security & Offline Badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/60 border border-emerald-500/20 text-[11px] text-emerald-400">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>100% Offline RAG • Zero Cloud APIs</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
