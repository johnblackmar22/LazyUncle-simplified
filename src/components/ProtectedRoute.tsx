import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ProtectedRoute = () => {
  const { user } = useAuthStore();
  
  // For demo purposes, if there's no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Otherwise, render the child routes
  return <Outlet />;
};

export default ProtectedRoute; 