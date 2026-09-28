import React from 'react';
import { MessageSquare, BookOpen, LayoutDashboard, Bookmark, Settings, Cpu, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ThemeToggle from './Common/ThemeToggle';

const Navbar = () => {
  const { activeTab, setActiveTab, systemHealth, setIsSettingsOpen } = useApp();

  const navItems = [
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'dashboard', label: 'Analytics Dashboard', icon: LayoutDashboard },
    { id: 'bookmarks', label: 'Saved Answers', icon: Bookmark },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 dark:border-cyan-500/20 bg-slate-900/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('chat')}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 shadow-glow-cyan">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-primary animate-pulse-slow" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">
                BlockMind AI
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                v1.0 • Offline
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Offline Blockchain Knowledge Assistant</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-white/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* System Status Indicators & Controls */}
        <div className="flex items-center gap-3">
          
          {/* Vector Store Status Pill */}
          <div
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-white/10 text-xs text-slate-300"
            title={`FAISS Vector Database: ${systemHealth.indexed_chunks} chunks indexed across ${systemHealth.indexed_documents} books`}
          >
            <Database className="w-3.5 h-3.5 text-accent" />
            <span className="font-mono text-cyan-400 font-medium">
              {systemHealth.indexed_chunks}
            </span>
            <span className="text-slate-400 text-[11px]">chunks</span>
          </div>

          {/* Ollama Status Pill */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono ${
              systemHealth.ollama_connected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
            title={
              systemHealth.ollama_connected
                ? `Ollama connected (Model: ${systemHealth.active_model})`
                : 'Ollama not detected; using BlockMind local synthesis engine'
            }
          >
            <div className={`w-2 h-2 rounded-full ${systemHealth.ollama_connected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span>{systemHealth.ollama_connected ? 'Ollama Online' : 'Local Fallback'}</span>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Settings Trigger */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl border border-white/10 hover:border-cyan-400/40 bg-slate-800/60 text-slate-300 hover:text-cyan-400 transition-all duration-200"
            title="Settings & Model Config"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
