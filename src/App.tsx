import React, { useEffect } from 'react';
import { Box, Spinner } from '@chakra-ui/react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import RecipientsListPage from './pages/RecipientsListPage';
import AddRecipientPage from './pages/AddRecipientPage';
import { RecipientDetailPage } from './pages/RecipientDetailPage';
import EditRecipientPage from './pages/EditRecipientPage';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { useAuthStore } from './store/authStore';
import OnboardingWizard from './components/OnboardingWizard';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { initializeDemoData } from './services/demoData';

function App() {
  const { initialized, user, demoMode, initializeAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Initialize auth store
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

    // Initialize demo data if in demo mode
    if (demoMode && user) {
      initializeDemoData();
    }

    return () => unsubscribe();
  }, [initializeAuth, demoMode, user]);

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
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/recipients" element={<RecipientsListPage />} />
          <Route path="/recipients/add" element={<AddRecipientPage />} />
          <Route path="/recipients/:id" element={<RecipientDetailPage />} />
          <Route path="/recipients/:id/edit" element={<EditRecipientPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/onboarding" element={<OnboardingWizard />} />
        </Route>
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;
