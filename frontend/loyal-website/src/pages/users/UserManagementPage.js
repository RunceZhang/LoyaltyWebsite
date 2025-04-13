import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const UserManagementPage = () => {
  const navigate = useNavigate();
  const { isSuperuser, isManager } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [filters, setFilters] = useState({
    name: '',
    role: '',
    verified: '',
    activated: '',
    page: 1,
    limit: 10
  });
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    // Redirect if neither superuser nor manager
    if (!isSuperuser && !isManager) {
      navigate('/dashboard');
      return;
    }

    fetchUsers();
  }, [filters, isSuperuser, isManager]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Create query params from filters
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== '' && filters[key] !== null) {
          queryParams.append(key, filters[key]);
        }
      });

      const response = await api.get(`/users?${queryParams.toString()}`);
      setUsers(response.data.results);
      setTotalUsers(response.data.count);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      page: 1 // Reset to first page on filter change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleVerifyUser = async (userId) => {
    try {
      await api.patch(`/users/${userId}`, { verified: true });
      
      // Update the user in the list
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, verified: true } : user
      ));
      
      setSuccessMessage('User verified successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error verifying user:', err);
      setError(err.response?.data?.message || 'Failed to verify user. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleClearSuspicious = async (userId) => {
    try {
      await api.patch(`/users/${userId}`, { suspicious: false });
      
      // Update the user in the list
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, suspicious: false } : user
      ));
      
      setSuccessMessage('User cleared of suspicious status successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error clearing suspicious status:', err);
      setError(err.response?.data?.message || 'Failed to clear suspicious status. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleModalOpen(true);
  };

  const closeRoleModal = () => {
    setRoleModalOpen(false);
    setSelectedUser(null);
    setNewRole('');
  };

  const handleRoleChange = (e) => {
    setNewRole(e.target.value);
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser) return;
    
    try {
      await api.patch(`/users/${selectedUser.id}`, { role: newRole });

      if (isManager && newRole !== 'cashier') {
        setError('Managers can only promote users to cashier.');
        setTimeout(() => setError(null), 3000);
        return;
      }

      if (isManager && selectedUser.role !== 'regular') {
        setError('Managers can only promote regular users to cashier.');
        setTimeout(() => setError(null), 3000);
        return;
      }

      // Update the user in the list
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id ? { ...user, role: newRole } : user
      ));
      
      setSuccessMessage(`User role updated to ${newRole} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      closeRoleModal();
    } catch (err) {
      console.error('Error updating user role:', err);
      setError(err.response?.data?.message || 'Failed to update user role. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'superuser':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'cashier':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isSuperuser && !isManager) {
    return null; // Already redirected by useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name or UTORid</label>
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Search by name or UTORid"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All Roles</option>
              <option value="regular">Regular</option>
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
              <option value="superuser">Superuser</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verified Status</label>
            <select
              name="verified"
              value={filters.verified}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Not Verified</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
            <select
              name="activated"
              value={filters.activated}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All</option>
              <option value="true">Activated</option>
              <option value="false">Never Logged In</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Users Table */}
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-700">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-700">No users found matching your criteria.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.avatarUrl ? (
                          <img className="h-10 w-10 rounded-full" src={user.avatarUrl} alt={user.name} />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.utorid}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.verified ? (
                          <span className="text-green-600">Verified</span>
                        ) : (
                          <span className="text-red-600">Not Verified</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.lastLogin ? 'Active' : 'Never Logged In'}
                      </div>
                      {user.suspicious && (
                        <div className="text-sm text-red-600">Suspicious</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.points}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {(isSuperuser || (isManager && user.role === 'regular')) && (
                            <button
                                onClick={() => openRoleModal(user)}
                                className="text-indigo-600 hover:text-indigo-900"
                            >
                              Change Role
                            </button>
                        )}
                        {!user.verified && (
                          <button
                            onClick={() => handleVerifyUser(user.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Verify
                          </button>
                        )}
                        {user.suspicious && (
                          <button
                            onClick={() => handleClearSuspicious(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Clear Suspicious
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalUsers > filters.limit && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(filters.page * filters.limit, totalUsers)}
                    </span>{' '}
                    of <span className="font-medium">{totalUsers}</span> results
                  </p>
                </div>
                <div>
                  <nav className="inline-flex rounded-md shadow">
                    <button
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page === 1}
                      className={`px-4 py-2 rounded-l-md ${
                        filters.page === 1 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                      } border border-gray-300`}
                    >
                      Previous
                    </button>
                    <div className="px-4 py-2 bg-white text-gray-700 border-t border-b border-gray-300">
                      Page {filters.page} of {Math.ceil(totalUsers / filters.limit)}
                    </div>
                    <button
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={filters.page >= Math.ceil(totalUsers / filters.limit)}
                      className={`px-4 py-2 rounded-r-md ${
                        filters.page >= Math.ceil(totalUsers / filters.limit)
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                      } border border-gray-300`}
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Change Role Modal */}
      {roleModalOpen && selectedUser && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Change User Role
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        Update the role for <strong>{selectedUser.name}</strong> ({selectedUser.utorid})
                      </p>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                            value={newRole}
                            onChange={handleRoleChange}
                            className="mt-2 w-full border border-gray-300 p-2 rounded"
                        >
                          <option value="regular">Regular</option>
                          <option value="cashier">Cashier</option>
                          {isSuperuser && (
                              <>
                                <option value="manager">Manager</option>
                                <option value="superuser">Superuser</option>
                              </>
                          )}
                        </select>
                      </div>
                      
                      <div className="mt-4 bg-yellow-50 p-4 rounded-md">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>
                                Changing a user's role will grant them different permissions in the system. Please make sure you trust this user with their new responsibilities.
                              </p>
                              <ul className="list-disc pl-5 mt-1">
                                <li>Managers can verify users, manage events, and handle transactions.</li>
                                <li>Superusers have full access to all system functionalities.</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  onClick={handleRoleUpdate}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Update Role
                </button>
                <button 
                  type="button" 
                  onClick={closeRoleModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;