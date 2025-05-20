import React from 'react';
import { Box } from '@chakra-ui/react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  const { initialized } = useAuthStore();
  
  // For demo purposes, we'll continue even if auth isn't initialized
  // In a real app, you might want to show a loading spinner here
  
  return (
    <Box minH="100vh" bg="gray.50">
      <Routes>
        {/* Public routes with shared Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="subscription/plans" element={<SubscriptionPlansPage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          {/* Add other public pages here if needed */}
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
            {/* Recipient routes */}
            <Route path="recipients" element={<RecipientsListPage />} />
            <Route path="recipients/add" element={<AddRecipientPage />} />
            <Route path="recipients/:id" element={<RecipientDetailPage />} />
            <Route path="recipients/:id/edit" element={<EditRecipientPage />} />
            {/* Gift routes */}
            {/* <Route path="gifts" element={<GiftsListPage />} />
            <Route path="gifts/:id" element={<GiftDetailPage />} />
            <Route path="gifts/add" element={<AddGiftPage />} />
            <Route path="gifts/add/:recipientId" element={<AddGiftPage />} />
            <Route path="gifts/:id/edit" element={<EditGiftPage />} /> */}
            {/* Settings route */}
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        {/* Onboarding route (outside Layout) */}
        <Route path="/onboarding" element={<OnboardingWizard />} />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Box>
  );
}

export default App;
