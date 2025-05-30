import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Spinner, ChakraProvider } from '@chakra-ui/react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { useAuthStore } from './store/authStore';
import { initializeDemoData } from './services/demoData';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
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

function App() {
  const { initialized, user, demoMode, initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize auth store once
    initializeAuth();

    // Set up Firebase listener only for non-demo mode
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const store = useAuthStore.getState();
      
      // Skip if in demo mode
      if (store.demoMode) return;
      
      if (firebaseUser) {
        useAuthStore.setState({
          user: {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            createdAt: Date.now(),
            planId: 'free',
          },
          initialized: true
        });
      } else {
        useAuthStore.setState({
          user: null,
          initialized: true
        });
      }
    });

    return () => unsubscribe();
  }, []); // Remove all dependencies to prevent re-initialization

  // Initialize demo data separately when needed
  useEffect(() => {
    if (demoMode && user) {
      initializeDemoData();
    }
  }, [demoMode, user]);

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
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/recipients" element={<RecipientsListPage />} />
            <Route path="/recipients/add" element={<AddRecipientPage />} />
            <Route path="/recipients/:id" element={<RecipientDetailPage />} />
            <Route path="/recipients/:id/edit" element={<EditRecipientPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </ChakraProvider>
  );
}

export default App;
