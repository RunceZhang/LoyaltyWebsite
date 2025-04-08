const bcrypt = require('bcrypt');
const { config } = require('../index');
const { v4: uuidv4 } = require('uuid');

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, config.saltRounds);
};

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password to verify
 * @param {string} hash - Hashed password to compare against
 * @returns {Promise<boolean>} - True if password matches hash
 */
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate a password reset token
 * @returns {string} - UUID token
 */
const generateResetToken = () => {
  return uuidv4();
};

/**
 * Calculate token expiry date
 * @returns {Date} - Expiry date
 */
const calculateTokenExpiry = () => {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + config.resetTokenExpiryHours);
  return expiry;
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateResetToken,
  calculateTokenExpiry
};