import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import BlockchainBackground from './components/BlockchainBackground';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/Chat/ChatWindow';
import KnowledgeGraphView from './components/KnowledgeGraph/KnowledgeGraphView';
import QuizView from './components/Quiz/QuizView';
import DocumentManager from './components/KnowledgeBase/DocumentManager';
import DashboardView from './components/Dashboard/DashboardView';
import BookmarksView from './components/Bookmarks/BookmarksView';
import SettingsModal from './components/Settings/SettingsModal';
import Toast from './components/Common/Toast';

const AppContent = () => {
  const { activeTab } = useApp();

  return (
    <div className="relative min-h-screen flex flex-col bg-[#0F172A] text-slate-100 overflow-hidden font-sans">
      {/* Interactive Blockchain Network Canvas Animation */}
      <BlockchainBackground />

      {/* Top Header Navigation */}
      <Navbar />

      {/* Main Container Layout */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Left Sidebar (visible on Chat view) */}
        {activeTab === 'chat' && <Sidebar />}

        {/* Tab Content Router */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'chat' && <ChatWindow />}
          {activeTab === 'graph' && <KnowledgeGraphView />}
          {activeTab === 'quiz' && <QuizView />}
          {activeTab === 'knowledge' && <DocumentManager />}
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'bookmarks' && <BookmarksView />}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <SettingsModal />
      <Toast />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
