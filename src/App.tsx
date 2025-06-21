import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import Registration from './pages/Registration';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Matchmaking from './pages/Matchmaking';
import Chat from './pages/Chat';
import Community from './pages/Community';
import AdminDashboard from './pages/AdminDashboard';
import CulturalQuiz from './pages/CulturalQuiz';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/cultural-quiz" element={<CulturalQuiz />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/matchmaking" element={
              <ProtectedRoute>
                <Matchmaking />
              </ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } />
            <Route path="/community" element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;