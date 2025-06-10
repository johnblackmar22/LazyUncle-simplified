import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authLogger } from '../utils/logger';

const ProtectedRoute = () => {
  const { user, demoMode, initialized } = useAuthStore();
  const location = useLocation();
  
  // Log authentication state for debugging
  useEffect(() => {
    authLogger.debug('Auth State:', { 
      user: !!user, 
      demoMode, 
      initialized,
      path: location.pathname
    });
  }, [user, demoMode, initialized, location.pathname]);
  
  // Don't redirect during initialization - wait for auth to be determined
  if (!initialized) {
    authLogger.debug('Waiting for auth initialization...');
    return null; // Show nothing while waiting for initialization
  }
  
  // Check if we have valid authentication
  // Either a real user (Firebase) OR demo mode is active
  const isAuthenticated = !!user || demoMode;
  
  if (!isAuthenticated) {
    authLogger.debug('No authentication found, redirecting to login');
    // Store the attempted location for potential redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // User is authenticated, allow access to protected routes
  authLogger.debug('Authentication verified, allowing access');
  return <Outlet />;
};

export default ProtectedRoute; 