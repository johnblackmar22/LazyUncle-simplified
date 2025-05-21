import React from 'react';
import { Box } from '@chakra-ui/react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import RecipientsListPage from './pages/RecipientsListPage';
import AddRecipientPage from './pages/AddRecipientPage';
import { RecipientDetailPage } from './pages/RecipientDetailPage';
import EditRecipientPage from './pages/EditRecipientPage';
import GiftsListPage from './pages/GiftsListPage';
import GiftDetailPage from './pages/GiftDetailPage';
import AddGiftPage from './pages/AddGiftPage';
import EditGiftPage from './pages/EditGiftPage';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { useAuthStore } from './store/authStore';
import OnboardingWizard from './components/OnboardingWizard';
import SubscriptionPlansPage from './pages/subscription/SubscriptionPlansPage';
import HowItWorksPage from './pages/HowItWorksPage';
import CheckoutPage from './pages/CheckoutPage';
import { Navbar } from './components/Navbar';

function App() {
  const { initialized, user } = useAuthStore();
  const location = useLocation();
  
  // Paths that should NEVER have the navbar
  const noNavbarPaths = [
    '/login', 
    '/register',
    '/onboarding'
  ];
  
  // Paths that should have navbar even when not logged in
  const publicWithNavbarPaths = [
    '/',
    '/subscription/plans',
    '/how-it-works'
  ];
  
  // Show navbar if:
  // 1. User is logged in AND we're not on a "no navbar" path, OR
  // 2. We're on a public path that should show the navbar
  const shouldShowNavbar = 
    (!!user && !noNavbarPaths.includes(location.pathname)) || 
    publicWithNavbarPaths.includes(location.pathname);
    
  console.log('Navbar visibility check:', { 
    path: location.pathname, 
    user: !!user, 
    shouldShow: shouldShowNavbar 
  });
  
  return (
    <Box minH="100vh" bg="gray.50">
      {/* Only show navbar where appropriate */}
      {shouldShowNavbar && <Navbar />}
      
      <Routes>
        {/* Public routes (completely standalone, no Layout) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/subscription/plans" element={<SubscriptionPlansPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
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
            {/* Gift routes */}
            <Route path="/gifts" element={<GiftsListPage />} />
            <Route path="/gifts/:id" element={<GiftDetailPage />} />
            <Route path="/gifts/add" element={<AddGiftPage />} />
            <Route path="/gifts/add/:recipientId" element={<AddGiftPage />} />
            <Route path="/gifts/:id/edit" element={<EditGiftPage />} />
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
