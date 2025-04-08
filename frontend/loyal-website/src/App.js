// App.js - The main application component
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import Dashboard from './pages/dashboard/Dashboard';
import UserProfilePage from './pages/users/UserProfilePage';
import TransactionPage from './pages/transactions/TransactionPage';
import TransactionListPage from './pages/transactions/TransactionListPage';
import TransactionDetailPage from './pages/transactions/TransactionDetailPage';
import EventListPage from './pages/events/EventListPage';
import EventDetailPage from './pages/events/EventDetailPage';
import PromotionListPage from './pages/promotions/PromotionListPage';
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
        
        {/* Promotion routes */}
        <Route path="/promotions" element={<PromotionListPage />} />
      </Route>
      
      {/* Catch all route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;