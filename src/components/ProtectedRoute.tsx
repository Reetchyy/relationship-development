import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { state } = useAuth();

  if (state.isLoading) {
    return <LoadingSpinner />;
  }

  if (!state.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}