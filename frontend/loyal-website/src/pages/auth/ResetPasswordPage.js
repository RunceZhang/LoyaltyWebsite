import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { authService } from '../../services/api';

const ResetPasswordPage = () => {
  const { resetToken } = useParams();
  const [utorid, setUtorid] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenReceived, setTokenReceived] = useState(false); // For displaying reset token to user (for testing)
  const [receivedToken, setReceivedToken] = useState('');
  
  // Check if we're in reset mode (with token) or request mode
  const isResetMode = !!resetToken;
  
  const validatePassword = (pass) => {
    // Password requirements: 8-20 characters, at least one uppercase, one lowercase, one number, one special character
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,20}$/;
    return regex.test(pass);
  };
  
  const handleRequestReset = async (e) => {
    e.preventDefault();
    
    if (!utorid) {
      setError('Please enter your UTORID');
      return;
    }
    
    try {
      setError('');
      setMessage('');
      setLoading(true);
      
      const result = await authService.requestReset(utorid);
      setMessage('If an account exists with that UTORID, a password reset link has been sent to your email.');
      
      // For development/testing only - display the reset token
      if (result.data && result.data.resetToken) {
        setTokenReceived(true);
        setReceivedToken(result.data.resetToken);
      }
    } catch (err) {
      if (err.response && err.response.status === 429) {
        setError('Too many requests. Please try again later.');
      } else {
        setError('Failed to request password reset: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!utorid) {
      setError('Please enter your UTORID');
      return;
    }
    
    if (!validatePassword(password)) {
      setError('Password must be 8-20 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setError('');
      setMessage('');
      setLoading(true);
      
      await authService.resetPassword(resetToken, utorid, password);
      setResetSuccess(true);
      setMessage('Password has been reset successfully. You can now log in with your new password.');
    } catch (err) {
      if (err.response) {
        if (err.response.status === 404) {
          setError('Invalid reset token.');
        } else if (err.response.status === 410) {
          setError('This reset token has expired. Please request a new one.');
        } else {
          setError('Failed to reset password: ' + (err.response.data?.message || err.message));
        }
      } else {
        setError('Failed to reset password: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isResetMode ? 'Reset your password' : 'Reset password request'}
          </h2>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {error}
                </h3>
              </div>
            </div>
          </div>
        )}
        
        {message && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  {message}
                </h3>
              </div>
            </div>
          </div>
        )}
        
        {/* Show received token for testing purposes */}
        {tokenReceived && (
          <div className="rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Reset Token (for testing): {receivedToken}
                </h3>
                <p className="text-sm text-yellow-700 mt-2">
                  Visit: /reset-password/{receivedToken} to reset your password
                </p>
              </div>
            </div>
          </div>
        )}
        
        {resetSuccess ? (
          <div className="mt-6">
            <Link 
              to="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={isResetMode ? handleResetPassword : handleRequestReset}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="utorid" className="sr-only">UTORID</label>
                <input
                  id="utorid"
                  name="utorid"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="UTORID"
                  value={utorid}
                  onChange={(e) => setUtorid(e.target.value)}
                />
              </div>
              
              {isResetMode && (
                <>
                  <div>
                    <label htmlFor="password" className="sr-only">New Password</label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder="New Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="sr-only">Confirm New Password</label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading
                  ? (isResetMode ? 'Resetting Password...' : 'Sending Request...')
                  : (isResetMode ? 'Reset Password' : 'Request Password Reset')
                }
              </button>
            </div>
            
            <div className="text-center">
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;