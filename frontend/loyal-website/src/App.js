import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import Dashboard from './pages/dashboard/Dashboard';
import UserProfilePage from './pages/users/UserProfilePage';
import UserManagementPage from './pages/users/UserManagementPage';
import TransactionPage from './pages/transactions/TransactionPage';
import TransactionListPage from './pages/transactions/TransactionListPage';
import TransactionDetailPage from './pages/transactions/TransactionDetailPage';
import EventListPage from './pages/events/EventListPage';
import EventDetailPage from './pages/events/EventDetailPage';
import OrganizerEventListPage from './pages/events/OrganizerEventListPage';
import EventManagementPage from './pages/events/EventManagementPage';
import EventGuestsPage from './pages/events/EventGuestsPage';
import EventAwardPointsPage from './pages/events/EventAwardPointsPage';
import EventOrganizersPage from './pages/events/EventOrganizersPage';
import EventCreatePage from './pages/events/EventCreatePage';
import PromotionListPage from './pages/promotions/PromotionListPage';
import PromotionCreatePage from './pages/promotions/PromotionCreatePage';
import PromotionDetailPage from './pages/promotions/PromotionDetailPage';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/auth/PrivateRoute';
import NotFoundPage from './pages/NotFoundPage';
import './App.css';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/reset-password/:resetToken" element={<ResetPasswordPage />} />
      
      {/* Protected routes within Layout */}
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/" element={<Dashboard />} />
        
        {/* User routes */}
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/register" element={<PrivateRoute requiredRole="cashier"><RegisterPage /></PrivateRoute>} />
        
        {/* Transaction routes */}
        <Route path="/transactions" element={<TransactionPage />} />
        <Route path="/transactions/history" element={<TransactionListPage />} />
        <Route path="/transactions/:transactionId" element={<TransactionDetailPage />} />
        
        {/* Event routes */}
        <Route path="/events" element={<EventListPage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        
        {/* Event Organizer/Manager routes */}
        <Route path="/events/organizer" element={<PrivateRoute requiredRole="manager"><OrganizerEventListPage /></PrivateRoute>} />
        <Route path="/events/manage/:eventId" element={<PrivateRoute requiredRole="manager"><EventManagementPage /></PrivateRoute>} />
        <Route path="/events/guests/:eventId" element={<PrivateRoute requiredRole="manager"><EventGuestsPage /></PrivateRoute>} />
        <Route path="/events/award/:eventId" element={<PrivateRoute requiredRole="manager"><EventAwardPointsPage /></PrivateRoute>} />
        <Route path="/events/organizers/:eventId" element={<PrivateRoute requiredRole="manager"><EventOrganizersPage /></PrivateRoute>} />
        <Route path="/events/create" element={<PrivateRoute requiredRole="manager"><EventCreatePage /></PrivateRoute>} />
        
        {/* Promotion routes */}
        <Route path="/promotions" element={<PromotionListPage />} />
          <Route path="/promotions/create" element={<PrivateRoute requiredRole="manager"><PromotionCreatePage /></PrivateRoute>} />
          <Route path="/promotions/:promotionId" element={<PrivateRoute requiredRole="manager"><PromotionDetailPage /></PrivateRoute>} />

          {/* Superuser routes */}
        <Route path="/admin/users" element={<PrivateRoute requiredRole="superuser"><UserManagementPage /></PrivateRoute>} />
      </Route>
      
      {/* Catch all route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;