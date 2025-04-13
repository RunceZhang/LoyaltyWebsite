#!/usr/bin/env node
'use strict';

const port = (() => {
    const args = process.argv;

    if (args.length !== 3) {
        console.error("usage: node index.js port");
        process.exit(1);
    }

    const num = parseInt(args[2], 10);
    if (isNaN(num)) {
        console.error("error: argument must be an integer.");
        process.exit(1);
    }

    return num;
})();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const express = require("express");
const app = express();

app.use(express.json());

// ADD YOUR WORK HERE
const cors = require('cors');
const { expressjwt: jwt } = require('express-jwt');
const path = require('path');
const fs = require('fs');

// Config
const config = require('./config/config');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middlewares
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Authentication Middleware
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      const userId = req.auth.userId;
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user role is in the allowed roles array
      if (!roles.includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Add user to request for convenient access in controllers
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware to check if user is organizer for an event
const requireEventOrganizer = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const eventId = parseInt(req.params.eventId);
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Check if user is a manager (who can always access events)
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'manager' || user.role === 'superuser') {
      req.user = user;
      return next();
    }

    // Check if user is an organizer for this event
    const organizer = await prisma.eventOrganizer.findFirst({
      where: {
        eventId,
        userId
      }
    });

    if (!organizer) {
      return res.status(403).json({ error: 'User is not an organizer for this event' });
    }

    // Get the event to check if it's published (organizers can only see published events)
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event.published) {
      return res.status(404).json({ error: 'Event not found or not published' });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Helper middleware functions for specific roles
const requireRegular = requireRole([
  config.roles.REGULAR,
  config.roles.CASHIER, 
  config.roles.MANAGER, 
  config.roles.SUPERUSER
]);

const requireCashier = requireRole([
  config.roles.CASHIER, 
  config.roles.MANAGER, 
  config.roles.SUPERUSER
]);

const requireManager = requireRole([
  config.roles.MANAGER, 
  config.roles.SUPERUSER
]);

const requireSuperuser = requireRole([
  config.roles.SUPERUSER
]);

// Controllers
const authController = require('./controllers/authController');
const userController = require('./controllers/userController');
const transactionController = require('./controllers/transactionController');
const userTransactionController = require('./controllers/userTransactionController');
const eventController = require('./controllers/eventController');
const promotionController = require('./controllers/promotionController');

// Auth Routes
app.post('/auth/tokens', authController.login);
app.post('/auth/resets', authController.requestPasswordReset);
app.post('/auth/resets/:resetToken', authController.resetPassword);

// JWT Authentication middleware for protected routes
app.use(
  jwt({ 
    secret: config.jwtSecret, 
    algorithms: ['HS256'] 
  }).unless({ 
    path: [
      /^\/api\/auth\/.*/  // All auth routes are public
    ] 
  })
);

// Error handling middleware for JWT errors
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid or missing token' });
  }
  next(err);
});

// Configure multer for avatar uploads
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/');
  },
  filename: function (req, file, cb) {
    // Use utorid as filename and keep extension
    const extension = file.originalname.split('.').pop();
    cb(null, `${req.user.utorid}.${extension}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Only accept images
    console.log('Receiving file:', file.originalname, file.mimetype);
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// User Routes
app.post('/users', requireCashier, userController.registerUser);
app.get('/users', requireManager, userController.listUsers);
app.get('/users/me', requireRegular, userController.getCurrentUser);
app.patch('/users/me', requireRegular, upload.single('avatar'), userController.updateCurrentUser);
app.patch('/users/me/password', requireRegular, userController.updatePassword);
app.get('/users/:userId', requireCashier, userController.getUserById);
app.patch('/users/:userId', requireManager, userController.updateUser);

// Transaction Routes
app.post('/transactions', requireCashier, transactionController.createTransaction);
app.get('/transactions', requireManager, transactionController.listTransactions);
app.get('/transactions/:transactionId', requireManager, transactionController.getTransactionById);
app.patch('/transactions/:transactionId/suspicious', requireManager, transactionController.updateSuspiciousStatus);
app.patch('/transactions/:transactionId/processed', requireCashier, transactionController.markRedemptionProcessed);

// User-Transaction Routes
app.get('/users/me/transactions', requireRegular, userTransactionController.getUserTransactions);
app.post('/users/me/transactions', requireRegular, userTransactionController.createUserRedemption);
app.post('/users/:userId/transactions', requireRegular, userTransactionController.createTransfer);

// Event Routes
app.post('/events', requireManager, eventController.createEvent);
app.get('/events', requireRegular, eventController.listEvents);
app.get('/events/:eventId', requireRegular, eventController.getEventById);
app.patch('/events/:eventId', requireEventOrganizer, eventController.updateEvent);
app.delete('/events/:eventId', requireManager, eventController.deleteEvent);

// Event Organizers Routes
app.post('/events/:eventId/organizers', requireManager, eventController.addOrganizer);
app.delete('/events/:eventId/organizers/:userId', requireManager, eventController.removeOrganizer);

// Event Guests Routes
app.post('/events/:eventId/guests', requireEventOrganizer, eventController.addGuest);
app.post('/events/:eventId/guests/me', requireRegular, eventController.addCurrentUserAsGuest);
app.delete('/events/:eventId/guests/me', requireRegular, eventController.removeCurrentUserAsGuest);
app.delete('/events/:eventId/guests/:userId', requireManager, eventController.removeGuest);

// Event Transactions Routes
app.post('/events/:eventId/transactions', requireEventOrganizer, eventController.createEventTransaction);

// Promotion Routes
app.post('/promotions', requireManager, promotionController.createPromotion);
app.get('/promotions', requireRegular, promotionController.listPromotions);
app.get('/promotions/:promotionId', requireRegular, promotionController.getPromotionById);
app.patch('/promotions/:promotionId', requireManager, promotionController.updatePromotion);
app.delete('/promotions/:promotionId', requireManager, promotionController.deletePromotion);

// Method not allowed handler (405)
app.all('*', (req, res, next) => {
  const error = new Error(`Method ${req.method} not allowed for ${req.originalUrl}`);
  error.statusCode = 405;
  next(error);
});

// Handle 404 for non-existent routes
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});