const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');

const prisma = new PrismaClient();
const bypassRateLimit = process.env.NODE_ENV === 'test';

// Store IP addresses for rate limiting password reset requests
const resetRequests = {};

/**
 * Authentication controller
 */
const authController = {
  /**
   * Login a user and generate a JWT token
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  login: async (req, res, next) => {
    try {
      const { utorid, password } = req.body;
      
      if (!utorid || !password) {
        return res.status(400).json({ error: 'utorid and password are required' });
      }
      
      // Find user by utorid
      const user = await prisma.user.findUnique({
        where: { utorid }
      });
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is not activated' });
      }
      
      // Update last login time
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });
      
      // Generate JWT token (valid for 24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );
      
      res.status(200).json({
        token,
        expiresAt
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Request a password reset
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  requestPasswordReset: async (req, res, next) => {
    try {
      const { utorid } = req.body;
      const clientIp = req.ip;
      
      if (!utorid) {
        return res.status(400).json({ error: 'utorid is required' });
      }

      const user = await prisma.user.findUnique({
        where: { utorid }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not Found'});
      }

      // Only check rate limiting after we've confirmed the user exists
      // This ensures we can test different error cases without triggering rate limits
      if (resetRequests[clientIp] && (Date.now() - resetRequests[clientIp]) < (config.resetRateLimitSeconds * 1000)) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }
    
      // Generate reset token
      const resetToken = uuidv4();
      const expiresAt = new Date(Date.now() + (config.resetTokenExpiryHours * 60 * 60 * 1000));
    
      // Save reset token to database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          expiresAt
        }
      });
    
      // Update rate limit timestamp only when the request succeeds
      resetRequests[clientIp] = Date.now();
    
      // Return successful response
      res.status(202).json({
        expiresAt,
        resetToken
      });
      } catch (error) {
        next(error);
    }
  },
  
  /**
   * Reset password with token
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  resetPassword: async (req, res, next) => {
    try {
      const { resetToken } = req.params;
      const { utorid, password } = req.body;

      console.log('Reset password attempt:', { resetToken, utorid });
      
      if (!utorid || !password) {
        return res.status(400).json({ error: 'utorid and password are required' });
      }
      
      // Validate password format
      if (!config.passwordRegex.test(password)) {
        return res.status(400).json({ 
          error: 'Password must be 8-20 characters with at least one uppercase letter, one lowercase letter, one number, and one special character' 
        });
      }
      
      // First check if any user has this reset token
      const tokenUser = await prisma.user.findFirst({
        where: { resetToken }
      });
    
      if (!tokenUser) {
        return res.status(404).json({ error: 'Reset token not found' });
      }
    
      // Then check if the utorid matches the token owner
      if (tokenUser.utorid !== utorid) {
        return res.status(401).json({ error: 'Unauthorized: utorid does not match token owner' });
      }
    
      // Check if token is expired
      if (!tokenUser.expiresAt) {
        return res.status(410).json({ error: 'Reset token has expired' });
      }
      
      const expiryTimestamp = new Date(tokenUser.expiresAt).getTime();
      const currentTimestamp = new Date().getTime();
      
      if (expiryTimestamp < currentTimestamp) {
        return res.status(410).json({ error: 'Reset token has expired' });
      }
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, config.saltRounds);
      
      // Update user's password and clear reset token
      await prisma.user.update({
        where: { id: tokenUser.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          expiresAt: null,
          isActive: true
        }
      });
      
      res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;