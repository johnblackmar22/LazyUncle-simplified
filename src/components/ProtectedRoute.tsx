import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { isDemoMode } from '../services/demoData';
import { DEMO_MODE } from '../services/firebase';

const ProtectedRoute = () => {
  const { user, demoMode } = useAuthStore();
  const storedDemoMode = isDemoMode();
  
  // If we have an active user, allow access
  if (user) {
    return <Outlet />;
  }
  
  // If in any demo mode (from store or localStorage), allow access
  if (storedDemoMode || demoMode) {
    return <Outlet />;
  }
  
  // If Firebase config is missing (DEMO_MODE), but user hasn't explicitly
  // chosen demo mode yet, redirect to login
  if (DEMO_MODE) {
    return <Navigate to="/login" replace />;
  }
  
  // For normal usage with no user, redirect to login
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute; 