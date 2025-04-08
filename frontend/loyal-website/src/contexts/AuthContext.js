// contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Define backend URL with fallback
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a token and fetch user data
    const checkToken = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        // Set token in axios default headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        const response = await api.get('/users/me');
        setCurrentUser(response.data);
      } catch (error) {
        // If token is invalid or expired, log out
        console.error('Error checking authentication:', error);
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };
    
    checkToken();
  }, []);

  const login = async (utorid, password) => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ utorid, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return data.message || 'Login failed';
      }
      
      // Store token in localStorage
      localStorage.setItem('token', data.token);
      
      // Set token in axios headers
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      // Set token expiration
      if (data.expiresAt) {
        const expirationDate = new Date(data.expiresAt).getTime();
        localStorage.setItem('tokenExpiration', expirationDate);
        
        // Set up automatic logout when token expires
        setupAutoLogout(expirationDate);
      }
      
      // Fetch user data with new token
      try {
        const userResponse = await api.get('/users/me');
        setCurrentUser(userResponse.data);
        navigate('/');
        return true;
      } catch (userError) {
        console.error('Failed to fetch user data:', userError);
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        return 'Failed to fetch user data';
      }
    } catch (error) {
      console.error('Login error:', error);
      return 'An unexpected error occurred';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');
    setCurrentUser(null);
    delete api.defaults.headers.common['Authorization'];
    navigate('/');
  };

  const setupAutoLogout = (expirationTime) => {
    const now = new Date().getTime();
    const timeLeft = expirationTime - now;
    
    if (timeLeft <= 0) {
      logout();
      return;
    }
    
    setTimeout(() => {
      logout();
    }, timeLeft);
  };

  const resetPassword = async (utorid) => {
    try {
      const response = await api.post('/auth/resets', { utorid });
      return response.data;
    } catch (error) {
      console.error('Reset password request failed:', error);
      throw error;
    }
  };

  const confirmResetPassword = async (resetToken, utorid, password) => {
    try {
      await api.post(`/auth/resets/${resetToken}`, { utorid, password });
      return true;
    } catch (error) {
      console.error('Password reset confirmation failed:', error);
      throw error;
    }
  };

  const updatePassword = async (oldPassword, newPassword) => {
    try {
      await api.patch('/users/me/password', { old: oldPassword, new: newPassword });
      return true;
    } catch (error) {
      console.error('Password update failed:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    resetPassword,
    confirmResetPassword,
    updatePassword,
    isAuthenticated: !!currentUser,
    isManager: currentUser?.role === 'manager' || currentUser?.role === 'superuser',
    isCashier: currentUser?.role === 'cashier' || currentUser?.role === 'manager' || currentUser?.role === 'superuser',
    isSuperuser: currentUser?.role === 'superuser',
    isVerified: currentUser?.verified,
    refreshUserData: async () => {
      try {
        const response = await api.get('/users/me');
        setCurrentUser(response.data);
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};