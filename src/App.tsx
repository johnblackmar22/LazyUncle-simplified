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
import DebugRecipientPage from './pages/DebugRecipientPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import SettingsPage from './pages/SettingsPage';
import AdminOrderDashboard from './pages/AdminOrderDashboard';

// Component to redirect admin users away from regular user routes
interface UserOnlyRouteProps {
  children: React.ReactNode;
}

const UserOnlyRoute: React.FC<UserOnlyRouteProps> = ({ children }) => {
  const { user } = useAuthStore();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('./services/firebase');
        const { COLLECTIONS } = await import('./utils/constants');
        
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.id));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const hasAdminRole = userData?.role && ['admin', 'super_admin'].includes(userData.role);
          setIsAdmin(hasAdminRole);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    };

    checkAdminRole();
  }, [user]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="50vh">
        <Spinner size="lg" color="blue.500" />
      </Box>
    );
  }

  // Redirect admin users to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin/orders" replace />;
  }

  return <>{children}</>;
};

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
            {/* Regular user routes - blocked for admin users */}
            <Route path="/dashboard" element={
              <UserOnlyRoute>
                <DashboardPage />
              </UserOnlyRoute>
            } />
            <Route path="/recipients" element={
              <UserOnlyRoute>
                <RecipientsListPage />
              </UserOnlyRoute>
            } />
            <Route path="/recipients/add" element={
              <UserOnlyRoute>
                <AddRecipientPage />
              </UserOnlyRoute>
            } />
            <Route path="/recipients/:id" element={
              <UserOnlyRoute>
                <RecipientDetailPage />
              </UserOnlyRoute>
            } />
            <Route path="/recipients/:id/edit" element={
              <UserOnlyRoute>
                <EditRecipientPage />
              </UserOnlyRoute>
            } />
            <Route path="/recipients/:id/debug" element={
              <UserOnlyRoute>
                <DebugRecipientPage />
              </UserOnlyRoute>
            } />
            <Route path="/settings" element={
              <UserOnlyRoute>
                <SettingsPage />
              </UserOnlyRoute>
            } />
            
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
            
            {/* Placeholder admin routes for future */}
            <Route path="/admin/analytics" element={
              <AdminRoute>
                <Box p={8}>
                  <h1>📊 Analytics Dashboard</h1>
                  <p>Coming soon...</p>
                </Box>
              </AdminRoute>
            } />
            <Route path="/admin/settings" element={
              <AdminRoute>
                <Box p={8}>
                  <h1>⚙️ Admin Settings</h1>
                  <p>Coming soon...</p>
                </Box>
              </AdminRoute>
            } />
          </Route>
        </Route>
      </Routes>
    </ChakraProvider>
  );
}

export default App;
