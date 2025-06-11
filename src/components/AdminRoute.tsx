// Admin Route Guard - Protects admin routes from non-admin users
import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import { useAdminRole } from '../hooks/useAdminRole';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAdmin, isLoading } = useAdminRole();

  // Show loading while checking admin status
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="50vh">
        <Spinner size="lg" color="purple.500" />
      </Box>
    );
  }

  // Redirect non-admin users to dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Allow access for admin users
  return <>{children}</>;
}; 