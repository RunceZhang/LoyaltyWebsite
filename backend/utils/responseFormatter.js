/**
 * Format a success response
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @returns {Object} - Formatted response object
 */
const formatSuccess = (data = null, message = 'Operation successful') => {
    return {
      status: 'success',
      message,
      data
    };
  };
  
  /**
   * Format an error response
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {any} errors - Additional error details
   * @returns {Object} - Formatted error object
   */
  const formatError = (message = 'An error occurred', statusCode = 400, errors = null) => {
    return {
      status: 'error',
      message,
      statusCode,
      errors
    };
  };
  
  module.exports = {
    formatSuccess,
    formatError
  };