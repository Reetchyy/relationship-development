import React, { ReactNode } from 'react';
import Navigation from './Navigation';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { logout, state } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900">
      <div className="flex">
        <Navigation />
        <div className="flex-1 md:ml-0">
          {/* Header for mobile */}
          <header className="md:hidden bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">DC</span>
              </div>
              <span className="text-white font-bold">Diaspora Connect</span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-300 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </header>

          {/* Main content */}
          <main className="p-4 pb-20 md:pb-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}