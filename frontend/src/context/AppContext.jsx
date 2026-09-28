import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Navigation View: 'chat' | 'knowledge' | 'dashboard' | 'bookmarks'
  const [activeTab, setActiveTab] = useState('chat');
  
  // Health & System state
  const [systemHealth, setSystemHealth] = useState({
    status: 'checking',
    ollama_connected: false,
    vector_store_ready: false,
    indexed_documents: 0,
    indexed_chunks: 0,
    active_model: 'qwen2.5:1.5b'
  });

  // Chat & Session State
  const [sessionId, setSessionId] = useState(() => 'sess_' + Math.random().toString(36).substring(2, 9));
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Documents State
  const [documents, setDocuments] = useState([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [isDocsLoading, setIsDocsLoading] = useState(false);

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState([]);
  
  // Settings & Modals
  const [settings, setSettings] = useState({
    ollama_base_url: 'http://localhost:11434',
    ollama_model: 'qwen2.5:1.5b',
    temperature: 0.2,
    similarity_top_k: 4,
    available_models: ['qwen2.5:1.5b', 'phi3:mini', 'llama3.2:1b']
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Fetch initial system health
  const refreshHealth = useCallback(async () => {
    try {
      const data = await api.checkHealth();
      setSystemHealth(data);
    } catch (e) {
      console.error('Health check failed', e);
    }
  }, []);

  // Fetch documents list
  const refreshDocuments = useCallback(async () => {
    setIsDocsLoading(true);
    try {
      const data = await api.listDocuments();
      setDocuments(data.documents || []);
      setTotalChunks(data.total_chunks || 0);
    } catch (e) {
      console.error('Failed to load documents', e);
    } finally {
      setIsDocsLoading(false);
    }
  }, []);

  // Fetch bookmarks
  const refreshBookmarks = useCallback(async () => {
    try {
      const data = await api.getBookmarks();
      setBookmarks(data || []);
    } catch (e) {
      console.error('Failed to load bookmarks', e);
    }
  }, []);

  // Fetch sessions
  const refreshSessions = useCallback(async () => {
    try {
      const data = await api.listSessions();
      setSessions(data || []);
    } catch (e) {
      console.error('Failed to list sessions', e);
    }
  }, []);

  // Load session messages
  const switchSession = async (newSessionId) => {
    setSessionId(newSessionId);
    try {
      const msgs = await api.getSessionMessages(newSessionId);
      setMessages(msgs || []);
    } catch (e) {
      setMessages([]);
    }
  };

  // Start a new chat session
  const startNewChat = () => {
    const newId = 'sess_' + Math.random().toString(36).substring(2, 9);
    setSessionId(newId);
    setMessages([]);
  };

  // Initial load
  useEffect(() => {
    refreshHealth();
    refreshDocuments();
    refreshBookmarks();
    refreshSessions();
  }, [refreshHealth, refreshDocuments, refreshBookmarks, refreshSessions]);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        systemHealth,
        refreshHealth,
        sessionId,
        setSessionId,
        sessions,
        refreshSessions,
        switchSession,
        startNewChat,
        messages,
        setMessages,
        isLoading,
        setIsLoading,
        documents,
        totalChunks,
        isDocsLoading,
        refreshDocuments,
        bookmarks,
        refreshBookmarks,
        settings,
        setSettings,
        isSettingsOpen,
        setIsSettingsOpen,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
