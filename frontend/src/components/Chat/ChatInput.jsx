import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, CornerDownLeft, Loader2, StopCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const ChatInput = ({ onSendMessage, isLoading, onStop }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);
  const { systemHealth } = useApp();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      <form
        onSubmit={handleSubmit}
        className="relative rounded-2xl bg-slate-900/80 border border-cyan-500/30 focus-within:border-cyan-400 focus-within:shadow-glow-cyan transition-all duration-300 backdrop-blur-xl p-2 sm:p-3"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask any blockchain question (e.g. 'What is Proof of Work and how does difficulty adjust?')..."
          rows={1}
          className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none resize-none px-2 py-1.5 max-h-44 min-h-[44px]"
        />

        <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1 px-1">
          {/* Status info pill */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              <span>Model: {systemHealth.active_model}</span>
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline text-slate-500">Press Enter to send, Shift+Enter for newline</span>
          </div>

          {/* Action Send / Stop */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 text-xs font-semibold transition-all"
              >
                <StopCircle className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200
                  ${
                    input.trim()
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 shadow-glow-cyan cursor-pointer transform active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                  }
                `}
              >
                <span>Ask Mind</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
