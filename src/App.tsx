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
import SubscriptionPlansPage from './pages/subscription/SubscriptionPlansPage';
import CheckoutPage from './pages/CheckoutPage';
import { Navbar } from './components/Navbar';
import { isDemoMode } from './services/demoData';
import { DEMO_MODE } from './services/firebase';

function App() {
  const { initialized, user, demoMode } = useAuthStore();
  const storedDemoMode = isDemoMode();
  const location = useLocation();
  
  // List ALL paths that should NEVER have the main navbar
  const noNavbarPaths = [
    '/', // Homepage has its own navbar
    '/login', 
    '/register',
    '/onboarding',
    '/subscription/plans', // This will now use HomePage's navbar
    '/checkout' // Use HomePage navbar
  ];
  
  if (!initialized) {
    // Show a loading spinner while auth is loading
    return <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" emptyColor="gray.200" position="fixed" top="50%" left="50%" transform="translate(-50%, -50%)" />;
  }
  
  // Consider a user authenticated if they have a user object OR any demo mode is active
  const isAuthenticated = !!user || demoMode || storedDemoMode || DEMO_MODE;
  
  // We show the main navbar when:
  // 1. User is authenticated AND
  // 2. We're not on a path that should never have the navbar
  const shouldShowNavbar = isAuthenticated && !noNavbarPaths.includes(location.pathname);
    
  // For debugging
  useEffect(() => {
    console.log('App component - Navbar visibility check:', { 
      path: location.pathname, 
      user: !!user,
      demoMode,
      storedDemoMode,
      DEMO_MODE,
      isAuthenticated,
      shouldShow: shouldShowNavbar 
    });
  }, [location.pathname, user, demoMode, storedDemoMode, isAuthenticated, shouldShowNavbar]);
  
  return (
    <Box minH="100vh" bg="gray.50" pt={shouldShowNavbar ? "64px" : "0"}>
      {/* Only show navbar for authenticated routes */}
      {shouldShowNavbar && <Navbar />}
      
      <Routes>
        {/* Public routes (completely standalone, no Layout) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/subscription/plans" element={<SubscriptionPlansPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        {/* Disable wizard for now - redirect to home */}
        <Route path="/onboarding" element={<Navigate to="/" replace />} />
        
        {/* Protected routes wrapped in Layout (with sidebar) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* Recipient routes */}
            <Route path="/recipients" element={<RecipientsListPage />} />
            <Route path="/recipients/add" element={<AddRecipientPage />} />
            <Route path="/recipients/:id" element={<RecipientDetailPage />} />
            <Route path="/recipients/:id/edit" element={<EditRecipientPage />} />
            {/* Settings route */}
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Box>
  );
}

export default App;
