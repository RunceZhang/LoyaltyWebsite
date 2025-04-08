import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const RegisterPage = () => {
  const [utorid, setUtorid] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState('');
  
  const { isCashier } = useAuth();
  const navigate = useNavigate();
  
  const validateUtorid = (id) => {
    // UTORID requirements: Alphanumeric, exactly 8 characters
    return /^[a-zA-Z0-9]{8}$/.test(id);
  };
  
  const validateEmail = (email) => {
    // Email requirements: Valid UofT email
    return /^[a-zA-Z0-9._%+-]+@mail\.utoronto\.ca$/.test(email);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!validateUtorid(utorid)) {
      setError('UTORID must be 8 alphanumeric characters');
      return;
    }
    
    if (!name || name.length > 50) {
      setError('Name is required and must be 1-50 characters');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid University of Toronto email (name@mail.utoronto.ca)');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      const response = await userService.registerUser({
        utorid,
        name,
        email
      });
      
      setSuccess(true);
      
      // For development/testing only - display the reset token
      if (response.data && response.data.resetToken) {
        setResetToken(response.data.resetToken);
      }
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setError('A user with this UTORID already exists');
      } else {
        setError('Failed to register user: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Redirect non-cashiers away
  if (!isCashier) {
    return <Navigate to="/" />;
  }
  
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Register New User</h1>
      
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {error}
              </h3>
            </div>
          </div>
        </div>
      )}
      
      {success ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="rounded-md bg-green-50 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  User registered successfully!
                </h3>
                <p className="text-sm text-green-700 mt-2">
                  An activation email has been sent to {email}.
                </p>
              </div>
            </div>
          </div>
          
          {resetToken && (
            <div className="rounded-md bg-yellow-50 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Activation Token (for testing): {resetToken}
                  </h3>
                  <p className="text-sm text-yellow-700 mt-2">
                    Visit: /reset-password/{resetToken} to set the password for this account
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between">
            <button
              onClick={() => {
                setUtorid('');
                setName('');
                setEmail('');
                setSuccess(false);
                setResetToken('');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Register Another User
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="utorid">
              UTORID
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="utorid"
              type="text"
              placeholder="8-character UTORID"
              value={utorid}
              onChange={(e) => setUtorid(e.target.value)}
              required
              maxLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">8 alphanumeric characters</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Full Name
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="name"
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-1">1-50 characters</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              placeholder="name@mail.utoronto.ca"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Must be a valid University of Toronto email</p>
          </div>
          
          <div className="flex items-center justify-between">
            <button
              className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register User'}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/')}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RegisterPage;