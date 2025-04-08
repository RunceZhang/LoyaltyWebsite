// services/api.js
import axios from 'axios';

// Define backend URL with fallback
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// Create axios instance with base URL
const api = axios.create({
  baseURL: BACKEND_URL,
});

// Add a request interceptor to include the JWT token if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error status codes
    if (error.response) {
      const { status } = error.response;
      
      // If token is invalid/expired, redirect to login
      if (status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// User API calls
export const userService = {
  // Get current user's data
  getCurrentUser: () => api.get('/users/me'),
  
  // Get list of users (for managers/cashiers)
  getUsers: (params) => api.get('/users', { params }),
  
  // Get specific user
  getUser: (userId) => api.get(`/users/${userId}`),
  
  // Register a new user (for cashiers)
  registerUser: (userData) => api.post('/users', userData),
  
  // Update current user's profile
  updateProfile: (profileData) => api.patch('/users/me', profileData),
  
  // Update user's status (for managers)
  updateUserStatus: (userId, statusData) => api.patch(`/users/${userId}`, statusData),
};

// Transaction API calls
export const transactionService = {
  // Create a purchase transaction (for cashiers)
  createPurchase: (purchaseData) => api.post('/transactions', {
    ...purchaseData,
    type: 'purchase'
  }),
  
  // Create an adjustment transaction (for managers)
  createAdjustment: (adjustmentData) => api.post('/transactions', {
    ...adjustmentData,
    type: 'adjustment'
  }),
  
  // Create a redemption transaction (for regular users)
  createRedemption: (redemptionData) => api.post('/users/me/transactions', {
    ...redemptionData,
    type: 'redemption'
  }),
  
  // Create a transfer transaction (for regular users)
  createTransfer: (userId, transferData) => api.post(`/users/${userId}/transactions`, {
    ...transferData,
    type: 'transfer'
  }),
  
  // Get list of all transactions (for managers)
  getAllTransactions: (params) => api.get('/transactions', { params }),
  
  // Get current user's transactions
  getUserTransactions: (params) => api.get('/users/me/transactions', { params }),
  
  // Get specific transaction
  getTransaction: (transactionId) => api.get(`/transactions/${transactionId}`),
  
  // Mark a transaction as suspicious/not suspicious (for managers)
  updateTransactionSuspicious: (transactionId, suspicious) => 
    api.patch(`/transactions/${transactionId}/suspicious`, { suspicious }),
    
  // Mark a redemption as processed (for cashiers)
  processRedemption: (transactionId) => 
    api.patch(`/transactions/${transactionId}/processed`, { processed: true }),
};

// Event API calls
export const eventService = {
  // Create a new event (for managers)
  createEvent: (eventData) => api.post('/events', eventData),
  
  // Get list of events
  getEvents: (params) => api.get('/events', { params }),
  
  // Get specific event
  getEvent: (eventId) => api.get(`/events/${eventId}`),
  
  // Update an event
  updateEvent: (eventId, eventData) => api.patch(`/events/${eventId}`, eventData),
  
  // Delete an event (for managers, only if not published)
  deleteEvent: (eventId) => api.delete(`/events/${eventId}`),
  
  // Add an organizer to an event (for managers)
  addOrganizer: (eventId, utorid) => api.post(`/events/${eventId}/organizers`, { utorid }),
  
  // Remove an organizer from an event (for managers)
  removeOrganizer: (eventId, userId) => api.delete(`/events/${eventId}/organizers/${userId}`),
  
  // Add a guest to an event (for managers/organizers)
  addGuest: (eventId, utorid) => api.post(`/events/${eventId}/guests`, { utorid }),
  
  // Remove a guest from an event (for managers)
  removeGuest: (eventId, userId) => api.delete(`/events/${eventId}/guests/${userId}`),
  
  // RSVP current user to an event
  rsvpToEvent: (eventId) => api.post(`/events/${eventId}/guests/me`),
  
  // Cancel RSVP for current user
  cancelRsvp: (eventId) => api.delete(`/events/${eventId}/guests/me`),
  
  // Award points for an event
  awardPoints: (eventId, transactionData) => api.post(`/events/${eventId}/transactions`, {
    ...transactionData,
    type: 'event'
  }),
};

// Promotion API calls
export const promotionService = {
  // Create a new promotion (for managers)
  createPromotion: (promotionData) => api.post('/promotions', promotionData),
  
  // Get list of promotions
  getPromotions: (params) => api.get('/promotions', { params }),
  
  // Get specific promotion
  getPromotion: (promotionId) => api.get(`/promotions/${promotionId}`),
  
  // Update a promotion
  updatePromotion: (promotionId, promotionData) => api.patch(`/promotions/${promotionId}`, promotionData),
  
  // Delete a promotion (for managers, only if not started)
  deletePromotion: (promotionId) => api.delete(`/promotions/${promotionId}`),
};

// Auth API calls
export const authService = {
  // Login a user
  login: (utorid, password) => api.post('/auth/tokens', { utorid, password }),
  
  // Request password reset
  requestReset: (utorid) => api.post('/auth/resets', { utorid }),
  
  // Reset password with token
  resetPassword: (resetToken, utorid, password) => 
    api.post(`/auth/resets/${resetToken}`, { utorid, password }),
    
  // Change password
  changePassword: (oldPassword, newPassword) => 
    api.patch('/users/me/password', { old: oldPassword, new: newPassword }),
};

export default api;