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
import AutoSendApprovalsPage from './pages/AutoSendApprovalsPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { useAuthStore } from './store/authStore';

function App() {
  const { initialized } = useAuthStore();
  
  // For demo purposes, we'll continue even if auth isn't initialized
  // In a real app, you might want to show a loading spinner here
  
  return (
    <Box minH="100vh" bg="gray.50">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
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
            
            {/* Auto-send routes */}
            <Route path="/auto-send/approvals" element={<AutoSendApprovalsPage />} />
          </Route>
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Box>
  );
}

export default App;
