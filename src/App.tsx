import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import UserMenu from './components/UserMenu';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="min-h-screen bg-dark-bg font-inter overflow-x-hidden">
          {/* Mobile menu button */}
          <div className="lg:hidden fixed top-4 left-4 z-50">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 sm:p-3 bg-dark-surface border border-dark-border rounded-lg text-dark-text hover:bg-dark-elevated transition-colors shadow-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>

          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div className="flex min-h-screen">
            {/* Sidebar */}
            <div className={`fixed lg:fixed top-0 left-0 z-50 lg:z-auto w-full sm:w-80 lg:w-64 h-screen ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
              <Sidebar 
                activeView={activeView} 
                onViewChange={(view) => {
                  setActiveView(view);
                  setSidebarOpen(false); // Close sidebar on mobile after selection
                }} 
              />
            </div>

            {/* Main Content */}
            <div className="flex-1 w-full lg:w-auto min-w-0 pt-16 lg:pt-0 lg:ml-64">
              <MainContent activeView={activeView} />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;