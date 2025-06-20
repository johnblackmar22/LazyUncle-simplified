import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Spinner, ChakraProvider } from '@chakra-ui/react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { useAuthStore } from './store/authStore';
import { initializeDemoData } from './services/demoData';
import { authLogger } from './utils/logger';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import theme from './theme';

// Pages
import HomePage from './pages/HomePage';
import DashboardPage from './pages/dashboard/DashboardPage';
import RecipientsListPage from './pages/RecipientsListPage';
import AddRecipientPage from './pages/AddRecipientPage';
import EditRecipientPage from './pages/EditRecipientPage';
import { RecipientDetailPage } from './pages/RecipientDetailPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import SettingsPage from './pages/SettingsPage';
import AdminOrderDashboard from './pages/AdminOrderDashboard';

function App() {
  const { initialized, user, demoMode, initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize auth store once - this should happen immediately and synchronously
    authLogger.debug('Initializing auth...');
    initializeAuth();
  }, []); // Run only once on mount

  useEffect(() => {
    // Set up Firebase listener only for non-demo mode, and only after auth is initialized
    if (!initialized) return;

    // If we're in demo mode, don't set up Firebase listener at all
    if (demoMode) {
      authLogger.debug('Skipping Firebase listener setup - in demo mode');
      return;
    }

    authLogger.debug('Setting up ongoing Firebase auth listener for state changes');
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const store = useAuthStore.getState();
      
      authLogger.debug('Firebase auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
      authLogger.debug('Current store state:', { demoMode: store.demoMode, user: !!store.user });
      
      // Double-check: Skip if demo mode was enabled after initialization
      if (store.demoMode) {
        authLogger.debug('Skipping Firebase auth state change - demo mode active');
        return;
      }
      
      // Only update if the current state doesn't already have this user
      // This prevents overriding state during initialization
      if (firebaseUser) {
        const newUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          planId: 'free',
        };
        
        // Only update if it's a different user or no user currently
        if (!store.user || store.user.id !== newUser.id) {
          useAuthStore.setState({
            user: newUser,
            initialized: true,
            demoMode: false
          });
          authLogger.debug('Firebase user updated in store');
        }
      } else if (store.user) {
        // Only clear user if we currently have one
        useAuthStore.setState({
          user: null,
          initialized: true,
          demoMode: false
        });
        authLogger.debug('Firebase user cleared from store');
      }
    });

    return () => unsubscribe();
  }, [initialized, demoMode]); // Re-run if initialization state or demo mode changes

  // Initialize demo data separately when needed
  useEffect(() => {
    if (demoMode && user) {
      authLogger.debug('Initializing demo data for user:', user.id);
      initializeDemoData();
    }
  }, [demoMode, user]);

  // Show loading only if not initialized
  if (!initialized) {
    return (
      <Box
        height="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }

  return (
    <ChakraProvider theme={theme}>
      <Routes>
        {/* HomePage - standalone without Layout to avoid double navbar */}
        <Route path="/" element={<HomePage />} />
        
        {/* Public Routes with Layout */}
        <Route element={<Layout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        
        {/* Protected Routes with Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            {/* Regular user routes */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/recipients" element={<RecipientsListPage />} />
            <Route path="/recipients/add" element={<AddRecipientPage />} />
            <Route path="/recipients/:id" element={<RecipientDetailPage />} />
            <Route path="/recipients/:id/edit" element={<EditRecipientPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* Admin-only routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <Navigate to="/admin/orders" replace />
              </AdminRoute>
            } />
            <Route path="/admin/orders" element={
              <AdminRoute>
                <AdminOrderDashboard />
              </AdminRoute>
            } />
          </Route>
        </Route>
      </Routes>
    </ChakraProvider>
  );
}

export default App;
