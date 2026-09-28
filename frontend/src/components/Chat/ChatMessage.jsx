import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Copy,
  Check,
  Bookmark,
  BookOpen,
  Volume2,
  VolumeX,
  Sparkles,
  User,
  Cpu,
  Award,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatPercent } from '../../utils/formatters';

const ChatMessage = ({ message, onOpenSources, isLast, isStreaming }) => {
  const { showToast, refreshBookmarks } = useApp();
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  const isUser = message.role === 'user';
  const hasSources = !isUser && message.sources && message.sources.length > 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    showToast('Answer copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      showToast('Text-to-speech not supported on this browser', 'error');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown before speaking
    const cleanText = message.content.replace(/[*#`_-]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleBookmark = async () => {
    try {
      setIsBookmarking(true);
      const api = await import('../../services/api');
      await api.createBookmark({
        id: message.id || 'bm_' + Date.now(),
        query: isUser ? message.content : 'Blockchain Insight',
        answer: isUser ? '' : message.content,
        sources: message.sources || [],
        timestamp: new Date().toISOString(),
        tags: ['Blockchain', 'RAG'],
      });
      await refreshBookmarks();
      showToast('Saved to Bookmarks library', 'success');
    } catch (e) {
      showToast('Failed to bookmark', 'error');
    } finally {
      setIsBookmarking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 sm:gap-4 py-4 px-4 rounded-2xl transition-all ${
        isUser
          ? 'bg-slate-800/40 border border-white/5 ml-auto max-w-2xl'
          : 'bg-slate-900/70 border border-cyan-500/20 shadow-lg max-w-4xl'
      }`}
    >
      {/* Role Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <User className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-primary shadow-glow-cyan">
            <Cpu className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header with Name & Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${isUser ? 'text-purple-300' : 'text-cyan-400'}`}>
              {isUser ? 'You' : 'BlockMind AI'}
            </span>
            {!isUser && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                Grounded RAG
              </span>
            )}
          </div>

          {/* Action Toolbar */}
          {!isUser && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Copy Answer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleSpeak}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={isSpeaking ? 'Stop Reading' : 'Read Aloud'}
              >
                {isSpeaking ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                onClick={handleBookmark}
                className="p-1 rounded-lg text-slate-400 hover:text-accent hover:bg-slate-800 transition-colors"
                title="Bookmark Answer"
              >
                <Bookmark className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Formatted Content */}
        <div className="markdown-body text-slate-200 text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
          {isStreaming && isLast && (
            <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
          )}
        </div>

        {/* Source Citations & References Pill Bar */}
        {hasSources && (
          <div className="pt-2 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span>Source References:</span>
              </div>
              <button
                onClick={() => onOpenSources(message.sources)}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
              >
                <span>Inspect All ({message.sources.length})</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {message.sources.map((src, idx) => (
                <button
                  key={src.id || idx}
                  onClick={() => onOpenSources([src])}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-cyan-500/20 hover:border-cyan-500/40 text-left transition-all"
                >
                  <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-xs text-slate-300 font-medium truncate max-w-[160px]">
                    {src.book_name}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {Math.round(src.similarity_score * 100)}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;
