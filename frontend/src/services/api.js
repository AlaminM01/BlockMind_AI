import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 45000,
});

export const checkHealth = async () => {
  try {
    const res = await api.get('/health');
    return res.data;
  } catch (err) {
    return {
      status: 'offline',
      ollama_connected: false,
      vector_store_ready: false,
      indexed_documents: 0,
      indexed_chunks: 0,
    };
  }
};

export const sendChatMessage = async (payload) => {
  const res = await api.post('/chat', payload);
  return res.data;
};

export const listSessions = async () => {
  const res = await api.get('/sessions');
  return res.data;
};

export const getSessionMessages = async (sessionId) => {
  const res = await api.get(`/sessions/${sessionId}`);
  return res.data;
};

export const clearSession = async (sessionId) => {
  const res = await api.delete(`/sessions/${sessionId}`);
  return res.data;
};

export const clearAllSessions = async () => {
  const res = await api.delete('/sessions');
  return res.data;
};

export const listDocuments = async () => {
  const res = await api.get('/documents');
  return res.data;
};

export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const deleteDocument = async (docId) => {
  const res = await api.delete(`/documents/${docId}`);
  return res.data;
};

export const reindexDocuments = async () => {
  const res = await api.post('/documents/reindex');
  return res.data;
};

export const previewDocument = async (docId) => {
  const res = await api.get(`/documents/preview/${docId}`);
  return res.data;
};

export const getBookmarks = async (tag, search) => {
  const params = {};
  if (tag) params.tag = tag;
  if (search) params.search = search;
  const res = await api.get('/bookmarks', { params });
  return res.data;
};

export const createBookmark = async (bookmark) => {
  const res = await api.post('/bookmarks', bookmark);
  return res.data;
};

export const deleteBookmark = async (bookmarkId) => {
  const res = await api.delete(`/bookmarks/${bookmarkId}`);
  return res.data;
};

export const getAnalytics = async () => {
  const res = await api.get('/analytics');
  return res.data;
};

export const getSettings = async () => {
  const res = await api.get('/settings');
  return res.data;
};

export const updateSettings = async (settings) => {
  const res = await api.post('/settings', settings);
  return res.data;
};

export const getQuizTopics = async () => {
  const res = await api.get('/quiz/topics');
  return res.data;
};

export const getQuizQuestions = async (topic, count = 5) => {
  const params = {};
  if (topic) params.topic = topic;
  if (count) params.count = count;
  const res = await api.get('/quiz', { params });
  return res.data;
};

export const submitQuiz = async (submissions) => {
  const res = await api.post('/quiz/submit', { submissions });
  return res.data;
};

export const getKnowledgeGraph = async () => {
  const res = await api.get('/graph');
  return res.data;
};

export default api;
