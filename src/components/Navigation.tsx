import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  User, 
  Heart, 
  MessageSquare, 
  Users, 
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
  const location = useLocation();
  const { logout, state } = useAuth();

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Heart, label: 'Matchmaking', path: '/matchmaking' },
    { icon: MessageSquare, label: 'Chat', path: '/chat' },
    { icon: Users, label: 'Community', path: '/community' },
  ];

  if (state.user?.isAdmin) {
    navItems.push({ icon: Settings, label: 'Admin', path: '/admin' });
  }

  return (
    <nav className="bg-slate-800/90 backdrop-blur-sm border-t border-slate-700 fixed bottom-0 left-0 right-0 z-50 md:relative md:border-t-0 md:border-r md:w-64 md:min-h-screen">
      <div className="flex md:flex-col md:h-full">
        {/* Logo for desktop */}
        <div className="hidden md:block p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">RP</span>
            </div>
            <span className="text-white font-bold text-xl">ReDPlAD</span>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex md:flex-col flex-1 md:px-4 md:py-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 flex-1 md:flex-none justify-center md:justify-start ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden md:block font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Logout button for desktop */}
          <button
            onClick={logout}
            className="hidden md:flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition-all duration-200 mt-auto"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}