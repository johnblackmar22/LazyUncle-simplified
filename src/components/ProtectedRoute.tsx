import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { isDemoMode } from '../services/demoData';
import { DEMO_MODE } from '../services/firebase';

const ProtectedRoute = () => {
  const { user, demoMode } = useAuthStore();
  const storedDemoMode = isDemoMode();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If user signs out while on a protected route, redirect them
    if (!user && !demoMode && !storedDemoMode) {
      navigate('/login', { replace: true });
    }
  }, [user, demoMode, storedDemoMode, navigate]);
  
  // If we have an active user, allow access
  if (user) {
    return <Outlet />;
  }
  
  // If explicitly in demo mode, allow access
  if (storedDemoMode || demoMode) {
    return <Outlet />;
  }
  
  // Otherwise redirect to login
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute; 