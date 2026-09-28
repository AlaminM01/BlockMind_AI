import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileDown, Sparkles, BookOpen, Trash2, Cpu, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import SuggestedPrompts from './SuggestedPrompts';
import SourceModal from './SourceModal';
import ExportModal from './ExportModal';
import * as api from '../../services/api';

const ChatWindow = () => {
  const {
    sessionId,
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    refreshSessions,
    showToast,
    systemHealth,
    settings,
    pendingQuery,
    setPendingQuery,
  } = useApp();

  const [selectedSources, setSelectedSources] = useState(null);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  useEffect(() => {
    if (pendingQuery && pendingQuery.trim()) {
      const q = pendingQuery;
      setPendingQuery('');
      handleSendMessage(q);
    }
  }, [pendingQuery]);

  const handleOpenSources = (sources) => {
    setSelectedSources(sources);
    setIsSourceModalOpen(true);
  };

  const handleSendMessage = async (queryText) => {
    if (!queryText.trim() || isLoading) return;

    // Add user message immediately
    const userMsgId = 'msg_' + Date.now();
    const userMsg = {
      id: userMsgId,
      session_id: sessionId,
      role: 'user',
      content: queryText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Use SSE streaming endpoint for real-time token delivery
      const eventSourceUrl = `/api/chat/stream?query=${encodeURIComponent(
        queryText
      )}&session_id=${encodeURIComponent(sessionId)}&model=${encodeURIComponent(
        settings.ollama_model
      )}&temperature=${settings.temperature}`;

      const eventSource = new EventSource(eventSourceUrl);
      setIsStreaming(true);

      const assistantMsgId = 'msg_ast_' + Date.now();
      let streamedAnswer = '';
      let retrievedSources = [];

      // Create placeholder assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          session_id: sessionId,
          role: 'assistant',
          content: '',
          sources: [],
          timestamp: new Date().toISOString(),
        },
      ]);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'sources') {
            retrievedSources = data.sources || [];
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? { ...msg, sources: retrievedSources }
                  : msg
              )
            );
          } else if (data.type === 'token') {
            streamedAnswer += data.token;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? { ...msg, content: streamedAnswer }
                  : msg
              )
            );
          } else if (data.type === 'done') {
            eventSource.close();
            setIsStreaming(false);
            setIsLoading(false);
            refreshSessions();
          }
        } catch (e) {
          console.error('Error parsing SSE event', e);
        }
      };

      eventSource.onerror = async (err) => {
        eventSource.close();
        setIsStreaming(false);
        // Fallback to standard POST query if SSE stream encounters issues
        try {
          const fallbackRes = await api.sendChatMessage({
            query: queryText,
            session_id: sessionId,
            model: settings.ollama_model,
            temperature: settings.temperature,
          });

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content: fallbackRes.answer,
                    sources: fallbackRes.sources,
                  }
                : msg
            )
          );
        } catch (postErr) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content:
                      'Unable to reach local AI service. Please ensure Ollama or backend is running.',
                  }
                : msg
            )
          );
        } finally {
          setIsLoading(false);
          refreshSessions();
        }
      };
    } catch (err) {
      console.error('Chat error', err);
      setIsLoading(false);
      setIsStreaming(false);
      showToast('Error communicating with AI engine', 'error');
    }
  };

  const handleClearSession = async () => {
    if (window.confirm('Clear messages in this conversation?')) {
      await api.clearSession(sessionId);
      setMessages([]);
      await refreshSessions();
      showToast('Chat cleared', 'info');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] relative overflow-hidden">
      
      {/* Top Session Header */}
      <div className="px-6 py-3 border-b border-white/10 bg-slate-900/40 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          <h2 className="text-xs sm:text-sm font-semibold text-slate-200">
            Blockchain RAG Session
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 font-mono border border-cyan-500/20">
            {systemHealth.indexed_chunks} Chunks
          </span>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-all"
                title="Export chat to PDF / Markdown"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>

              <button
                onClick={handleClearSession}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Clear current chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Messages Feed */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center mb-4 shadow-glow-cyan">
              <Cpu className="w-8 h-8 text-primary" />
            </div>

            <h1 className="text-2xl font-extrabold text-white mb-2">
              BlockMind AI Assistant
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
              100% Free & Offline Blockchain RAG Assistant. Ask questions grounded strictly in the 5 uploaded blockchain books & whitepapers.
            </p>

            <SuggestedPrompts onSelectPrompt={handleSendMessage} />
          </div>
        ) : (
          messages.map((msg, idx) => (
            <ChatMessage
              key={msg.id || idx}
              message={msg}
              onOpenSources={handleOpenSources}
              isLast={idx === messages.length - 1}
              isStreaming={isStreaming}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        onStop={() => {
          setIsLoading(false);
          setIsStreaming(false);
        }}
      />

      {/* Source Inspector Modal */}
      <SourceModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        sources={selectedSources}
      />

      {/* Export Report Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        messages={messages}
      />
    </div>
  );
};

export default ChatWindow;
