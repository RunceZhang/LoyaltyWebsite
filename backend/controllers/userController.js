const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');

const prisma = new PrismaClient();

/**
 * User controller for handling user-related operations
 */
const userController = {
  /**
   * Register a new user (cashier or higher role required)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  registerUser: async (req, res, next) => {
    try {
      const { utorid, name, email } = req.body;
      
      // Validate required fields
      if (!utorid || !name || !email) {
        return res.status(400).json({ error: 'utorid, name, and email are required' });
      }
      
      // Validate utorid format (8 alphanumeric characters)
      if (!config.utoridRegex.test(utorid)) {
        return res.status(400).json({ error: 'utorid must be 8 alphanumeric characters' });
      }
      
      // Validate name length
      if (name.length < 1 || name.length > 50) {
        return res.status(400).json({ error: 'name must be between 1 and 50 characters' });
      }
      
      // Validate email format (must be a UofT email)
      if (!config.emailRegex.test(email)) {
        return res.status(400).json({ error: 'email must be a valid University of Toronto email' });
      }
      
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { utorid },
            { email }
          ]
        }
      });
      
      if (existingUser) {
        if (existingUser.utorid === utorid) {
          return res.status(409).json({ error: 'utorid already exists' });
        } else {
          return res.status(409).json({ error: 'email already exists' });
        }
      }
      
      // Generate reset token for account activation
      const resetToken = uuidv4();
      
      // Set expiry date (7 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + config.activationTokenExpiryDays);
      
      // Generate temporary password (will be reset by user)
      const tempPassword = await bcrypt.hash(uuidv4(), config.saltRounds);
      
      // Create user
      const user = await prisma.user.create({
        data: {
          utorid,
          name,
          email,
          password: tempPassword,
          resetToken,
          expiresAt,
          createdById: req.auth.userId,
          isActive: false,
          verified: false
        }
      });
      
      // In a real application, send an activation email
      // For this assignment, return the token directly
      res.status(201).json({
        id: user.id,
        utorid: user.utorid,
        name: user.name,
        email: user.email,
        verified: user.verified,
        expiresAt: user.expiresAt,
        resetToken: user.resetToken
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get a list of users (manager or higher role required)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  listUsers: async (req, res, next) => {
    try {
      // Parse query parameters
      const { name, role, verified, activated, page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Build filter conditions
      const where = {};
      
      if (name) {
        where.OR = [
          { utorid: { contains: name } },
          { name: { contains: name } }
        ];
      }
      
      if (role) {
        where.role = role;
      }
      
      if (verified !== undefined) {
        where.verified = verified === 'true';
      }
      
      if (activated !== undefined) {
        if (activated === 'true') {
          where.lastLogin = { not: null };
        } else {
          where.lastLogin = null;
        }
      }
      
      // Get count of filtered users
      const count = await prisma.user.count({ where });
      
      // Get users with pagination
      const users = await prisma.user.findMany({
        where,
        skip: skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          utorid: true,
          name: true,
          email: true,
          birthday: true,
          role: true,
          points: true,
          createdAt: true,
          lastLogin: true,
          verified: true,
          avatarUrl: true
        }
      });
      
      // Transform response (exclude password and resetToken)
      const results = users.map(user => ({
        id: user.id,
        utorid: user.utorid,
        name: user.name,
        email: user.email,
        birthday: user.birthday,
        role: user.role,
        points: user.points,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        verified: user.verified,
        avatarUrl: user.avatarUrl
      }));
      
      res.status(200).json({
        count,
        results
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get a user by ID (cashier or higher role required)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  getUserById: async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      // Find user by id
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get available one-time promotions for the user
      const availablePromotions = await prisma.promotion.findMany({
        where: {
          isOneTime: true,
          isActive: true,
          endTime: { gte: new Date() },
          // Not already used by this user
          usages: {
            none: {
              userId: user.id
            }
          }
        }
      });
      
      // Format promotions for response
      const promotions = availablePromotions.map(promo => ({
        id: promo.id,
        name: promo.name,
        minSpending: promo.minSpending,
        rate: promo.rate,
        points: promo.points
      }));
      
      // Response depends on role of requester
      if (req.user.role === config.roles.MANAGER || req.user.role === config.roles.SUPERUSER) {
        // Full details for managers and superusers
        res.status(200).json({
          id: user.id,
          utorid: user.utorid,
          name: user.name,
          email: user.email,
          birthday: user.birthday,
          role: user.role,
          points: user.points,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          verified: user.verified,
          avatarUrl: user.avatarUrl,
          promotions
        });
      } else {
        // Limited details for cashiers
        res.status(200).json({
          id: user.id,
          utorid: user.utorid,
          name: user.name,
          points: user.points,
          verified: user.verified,
          promotions
        });
      }
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Update a user by ID (manager or higher role required)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  updateUser: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { email, verified, suspicious, role } = req.body;
      const userIdInt = parseInt(userId);

      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: 'Request body cannot be empty' });
      }

      if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Find user by id
      const user = await prisma.user.findUnique({
        where: { id: userIdInt }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Build update data
      const updateData = {};
      const fieldsChanged = []
      
      // Update email if provided
      if (email !== undefined) {
        if (!config.emailRegex.test(email)) {
          return res.status(400).json({ error: 'email must be a valid University of Toronto email' });
        }
        // Check if email is already used by another user
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            id: { not: userIdInt }
          }
        });
      
        if (existingUser) {
          return res.status(409).json({ error: 'email already exists' });
        }
      
        updateData.email = email;
        fieldsChanged.push('email')
      }
      
      // Update verified status if provided
      if (verified !== undefined) {
        const verifiedBool = verified === true || verified === 'true';
        // According to spec, verified should always be set to true
        if (!verifiedBool) {
          return res.status(400).json({ error: 'verified must be set to true' });
        }
      
        updateData.verified = true;
        fieldsChanged.push('verified')
      }
      
      // Update suspicious status if provided
      if (suspicious !== undefined) {
        updateData.suspicious = suspicious === true || suspicious === 'true';
        fieldsChanged.push('suspicious');
      }
      
      // Update role if provided
      if (role !== undefined) {
        if ((req.user.role === config.roles.REGULAR || req.user.role === config.roles.CASHIER) && (role === config.roles.MANAGER || role === config.roles.SUPERUSER)) {
          return res.status(403).json({ error: 'Insufficient permissions to modify user roles' });
        }

        // Check if manager is trying to set a role they can't
        if (req.user.role === config.roles.MANAGER) {
          // Managers can only promote to cashier or demote to regular
          if (![config.roles.REGULAR, config.roles.CASHIER].includes(role)) {
            return res.status(403).json({ error: 'Managers can only promote to cashier or demote to regular' });
          }
        }

        // Check if role is valid (even for superuser)
        if (![config.roles.REGULAR, config.roles.CASHIER, config.roles.MANAGER, config.roles.SUPERUSER].includes(role)) {
          return res.status(400).json({ error: 'Invalid role' });
        }
      
        updateData.role = role;
        fieldsChanged.push('role');

        // If promoting to cashier, ensure suspicious is set to false
        if (role === config.roles.CASHIER && user.role !== config.roles.CASHIER) {
          updateData.suspicious = false;
          // Only add to fieldsChanged if it's actually changing
          if (user.suspicious !== false) {
            fieldsChanged.push('suspicious');
          }
        }
      }

      
      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userIdInt },
        data: updateData
      });
      
      // Return only the updated fields
      const responseData = {
        id: updatedUser.id,
        utorid: updatedUser.utorid,
        name: updatedUser.name
      };
      
      if (fieldsChanged.includes('email')) responseData.email = updatedUser.email;
      if (fieldsChanged.includes('verified')) responseData.verified = updatedUser.verified;
      if (fieldsChanged.includes('suspicious')) responseData.suspicious = updatedUser.suspicious;
      if (fieldsChanged.includes('role')) responseData.role = updatedUser.role;
      
      res.status(200).json(responseData);
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get current logged-in user's profile
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  getCurrentUser: async (req, res, next) => {
    try {
      const userId = req.auth.userId;
      
      // Get user with fresh data
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get available one-time promotions for the user
      const availablePromotions = await prisma.promotion.findMany({
        where: {
          type: 'one-time',
          isOneTime: true,
          isActive: true,
          endTime: { gte: new Date() },
          // Not already used by this user
          usages: {
            none: {
              userId: user.id
            }
          }
        }
      });
      
      // Format promotions for response
      const promotions = availablePromotions.map(promo => ({
        id: promo.id,
        name: promo.name,
        minSpending: promo.minSpending,
        rate: promo.rate,
        points: promo.points
      }));
      
      res.status(200).json({
        id: user.id,
        utorid: user.utorid,
        name: user.name,
        email: user.email,
        birthday: user.birthday,
        role: user.role,
        points: user.points,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        verified: user.verified,
        avatarUrl: user.avatarUrl,
        promotions
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Update current logged-in user's profile
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  updateCurrentUser: async (req, res, next) => {
    try {
      const userId = req.auth.userId;
      const { name, email, birthday } = req.body;
      const avatarFile = req.file;

      console.log(req.body);

      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: 'Request body cannot be empty' });
      }
      
      // Build update data
      const updateData = {};
      
      // Update name if provided
      if (name !== undefined) {
        if (name.length < 1 || name.length > 50) {
          return res.status(400).json({ error: 'name must be between 1 and 50 characters' });
        }
        updateData.name = name;
      }
      
      // Update email if provided
      if (email !== undefined) {
        if (!config.emailRegex.test(email)) {
          return res.status(400).json({ error: 'email must be a valid University of Toronto email' });
        }
        
        // Check if email is already used by another user
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            id: { not: userId }
          }
        });
        
        if (existingUser) {
          return res.status(409).json({ error: 'email already exists' });
        }
        
        updateData.email = email;
      }
      
      // Update birthday if provided
      if (birthday !== undefined) {
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(birthday)) {
          return res.status(400).json({ error: 'birthday must be in format YYYY-MM-DD' });
        }
        
        updateData.birthday = birthday;
      }
      
      // Update avatar if file provided
      if (avatarFile) {
        // Get user's utorid
        const user = await prisma.user.findUnique({
          where: { id: userId }
        });
        
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Set avatar URL path
        const avatarUrl = `/uploads/avatars/${avatarFile.filename}`;
        updateData.avatarUrl = avatarUrl;

        console.log('Avatar file received:', avatarFile);
        console.log('Setting avatarUrl to:', avatarUrl);
      }
      
      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData
      });
      
      res.status(200).json({
        id: updatedUser.id,
        utorid: updatedUser.utorid,
        name: updatedUser.name,
        email: updatedUser.email,
        birthday: updatedUser.birthday,
        role: updatedUser.role,
        points: updatedUser.points,
        createdAt: updatedUser.createdAt,
        lastLogin: updatedUser.lastLogin,
        verified: updatedUser.verified,
        avatarUrl: updatedUser.avatarUrl
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Update current logged-in user's password
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  updatePassword: async (req, res, next) => {
    try {
      const userId = req.auth.userId;
      const { old, new: newPassword } = req.body;
      
      if (!old || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }
      
      // Validate new password format
      if (!config.passwordRegex.test(newPassword)) {
        return res.status(400).json({ 
          error: 'Password must be 8-20 characters with at least one uppercase letter, one lowercase letter, one number, and one special character' 
        });
      }
      
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Verify current password
      const isPasswordValid = await bcrypt.compare(old, user.password);
      if (!isPasswordValid) {
        return res.status(403).json({ error: 'Current password is incorrect' });
      }
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, config.saltRounds);
      
      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });
      
      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;