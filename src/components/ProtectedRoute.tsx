import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { isDemoMode } from '../services/demoData';
import { DEMO_MODE } from '../services/firebase';

const ProtectedRoute = () => {
  const { user, demoMode, initialized } = useAuthStore();
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
      initialized,
      path: location.pathname
    });
  }, [user, demoMode, storedDemoMode, initialized, location.pathname]);
  
  // Don't redirect during initialization - wait for auth to be determined
  if (!initialized) {
    console.log('ProtectedRoute - Waiting for auth initialization...');
    return null; // Or could return a loading spinner
  }
  
  // Check if we have valid authentication
  const isAuthenticated = !!user || demoMode || storedDemoMode || DEMO_MODE;
  
  if (!isAuthenticated) {
    console.log('Protected route accessed without auth, redirecting to login');
    // Store the attempted location for potential redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // User is authenticated, allow access to protected routes
  console.log('ProtectedRoute - User authenticated, allowing access');
  return <Outlet />;
};

export default ProtectedRoute; 