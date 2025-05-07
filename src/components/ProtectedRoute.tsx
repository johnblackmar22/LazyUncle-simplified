import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { isDemoMode } from '../services/demoData';

const ProtectedRoute = () => {
  const { user, demoMode } = useAuthStore();
  const isDemo = isDemoMode();
  
  // If in demo mode, allow access regardless of user state
  if (isDemo || demoMode) {
    return <Outlet />;
  }
  
  // For normal usage, if there's no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Otherwise, render the child routes
  return <Outlet />;
};

export default ProtectedRoute; 