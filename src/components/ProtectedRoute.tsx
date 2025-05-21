import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { isDemoMode } from '../services/demoData';
import { DEMO_MODE } from '../services/firebase';

const ProtectedRoute = () => {
  const { user, demoMode } = useAuthStore();
  const storedDemoMode = isDemoMode();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Log authentication state for debugging
  useEffect(() => {
    console.log('ProtectedRoute - Auth State:', { 
      user: !!user, 
      demoMode, 
      storedDemoMode,
      DEMO_MODE,
      path: location.pathname
    });
  }, [user, demoMode, storedDemoMode, location.pathname]);
  
  useEffect(() => {
    // If user signs out while on a protected route, redirect them immediately
    if (!user && !demoMode && !storedDemoMode && !DEMO_MODE) {
      console.log('No auth detected, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [user, demoMode, storedDemoMode, navigate, location.pathname]);
  
  // Check if we have valid authentication
  const isAuthenticated = !!user || demoMode || storedDemoMode || DEMO_MODE;
  
  if (!isAuthenticated) {
    console.log('Protected route accessed without auth, redirecting');
    // Store the attempted location for potential redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // User is authenticated, allow access to protected routes
  return <Outlet />;
};

export default ProtectedRoute; 