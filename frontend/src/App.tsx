// frontend/src/App.tsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Components
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';

// Pages
import DashboardPage from './pages/DashboardPage';
import MarkersPage from './pages/MarkersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <Header onToggleSidebar={toggleSidebar} />
          
          {/* Sidebar */}
          <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
          
          {/* Main Content */}
          <main className={`
            pt-16 transition-all duration-300 ease-in-out
            ${sidebarOpen ? 'md:ml-64' : 'ml-0'}
          `}>
            <div className="container mx-auto px-4 py-6">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/markers" element={<MarkersPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
          </main>
          
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
};

// 404 페이지 컴포넌트
const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-6xl mb-4">🚧</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">페이지를 찾을 수 없습니다</h1>
      <p className="text-gray-600 mb-6">
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
      </p>
      <button
        onClick={() => window.history.back()}
        className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors"
      >
        이전 페이지로 돌아가기
      </button>
    </div>
  );
};

export default App;