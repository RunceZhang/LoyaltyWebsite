// components/auth/PrivateRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If requiredRole is specified, check if the user has the required role
  if (requiredRole) {
    const roles = {
      'regular': ['regular', 'cashier', 'manager', 'superuser'],
      'cashier': ['cashier', 'manager', 'superuser'],
      'manager': ['manager', 'superuser'],
      'superuser': ['superuser']
    };
    
    if (!roles[requiredRole].includes(currentUser.role)) {
      // User doesn't have the required role, redirect to dashboard
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default PrivateRoute;