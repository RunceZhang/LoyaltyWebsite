import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService, authService } from '../../services/api';
import { UserQRCode } from '../../components/qrcode/QRCodeComponents';

const UserProfilePage = () => {
  const { currentUser, refreshUserData } = useAuth();
  
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [birthday, setBirthday] = useState(currentUser?.birthday || '');
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Show QR code state
  const [showQR, setShowQR] = useState(false);

  const validatePassword = (pass) => {
    // Password requirements: 8-20 characters, at least one uppercase, one lowercase, one number, one special character
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,20}$/;
    return regex.test(pass);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setMessage('');
      setLoading(true);
      
      const formData = new FormData();
      if (name !== currentUser.name) formData.append('name', name);
      if (email !== currentUser.email) formData.append('email', email);
      if (birthday !== currentUser.birthday) formData.append('birthday', birthday);
      if (avatar) formData.append('avatar', avatar);
      
      await userService.updateProfile(formData);
      await refreshUserData();
      
      setEditMode(false);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!validatePassword(newPassword)) {
      setPasswordError('Password must be 8-20 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    try {
      setPasswordError('');
      setPasswordMessage('');
      setPasswordLoading(true);
      
      await authService.changePassword(oldPassword, newPassword);
      
      setShowPasswordForm(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Password changed successfully!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setPasswordError('Current password is incorrect');
      } else {
        setPasswordError('Failed to change password: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
    }
  };
  
  // If the user data is not loaded yet, show loading
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading profile data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Profile header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-24 h-24 bg-white rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center mb-4 md:mb-0 md:mr-6">
              {currentUser.avatarUrl ? (
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-blue-600 text-4xl font-bold">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{currentUser.name}</h2>
              <div className="text-blue-100">@{currentUser.utorid}</div>
              <div className="flex items-center mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentUser.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {currentUser.verified ? 'Verified' : 'Unverified'}
                </span>
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                  {currentUser.role}
                </span>
              </div>
            </div>
            <div className="mt-4 md:mt-0 md:ml-auto">
              <button
                onClick={() => setShowQR(!showQR)}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {showQR ? 'Hide QR Code' : 'Show QR Code'}
              </button>
            </div>
          </div>
        </div>
        
        {/* QR Code display */}
        {showQR && (
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-center">
            <UserQRCode />
          </div>
        )}
        
        {/* Success/Error Messages */}
        {message && (
          <div className="p-4 bg-green-50 border-b border-green-100">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{message}</p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Profile Info */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Profile Information</h3>
            <button
              onClick={() => setEditMode(!editMode)}
              className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {editMode ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>
          
          {!editMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Name</div>
                  <div>{currentUser.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">UTORID</div>
                  <div>{currentUser.utorid}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Email</div>
                  <div>{currentUser.email}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Birthday</div>
                  <div>{currentUser.birthday ? new Date(currentUser.birthday).toLocaleDateString() : 'Not set'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Points Balance</div>
                  <div className="text-xl font-bold text-blue-600">{currentUser.points}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Account Created</div>
                  <div>{new Date(currentUser.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  {showPasswordForm ? 'Cancel Password Change' : 'Change Password'}
                </button>
              </div>
              
              {/* Password change form */}
              {showPasswordForm && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                  
                  {passwordMessage && (
                    <div className="rounded-md bg-green-50 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">{passwordMessage}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {passwordError && (
                    <div className="rounded-md bg-red-50 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-800">{passwordError}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handlePasswordChange}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="oldPassword"
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Password must be 8-20 characters with at least one uppercase letter, one lowercase letter, one number, and one special character.
                        </p>
                      </div>
                      
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={passwordLoading}
                          className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                            passwordLoading ? 'opacity-70 cursor-not-allowed' : ''
                          }`}
                        >
                          {passwordLoading ? 'Changing Password...' : 'Change Password'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : (
            /* Edit profile form */
            <form onSubmit={handleUpdateProfile}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={50}
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Must be a valid University of Toronto email.</p>
                </div>
                
                <div>
                  <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-1">
                    Birthday
                  </label>
                  <input
                    type="date"
                    id="birthday"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Picture
                  </label>
                  <input
                    type="file"
                    id="avatar"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                  {avatar && (
                    <div className="mt-2 flex items-center">
                      <span className="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                        <img
                          src={URL.createObjectURL(avatar)}
                          alt="Avatar preview"
                          className="h-full w-full object-cover"
                        />
                      </span>
                      <button
                        type="button"
                        className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={() => setAvatar(null)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="pt-5">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setEditMode(false);
                        setName(currentUser.name || '');
                        setEmail(currentUser.email || '');
                        setBirthday(currentUser.birthday || '');
                        setAvatar(null);
                      }}
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        loading ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;