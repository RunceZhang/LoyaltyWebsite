import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const EventOrganizersPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [organizerFormData, setOrganizerFormData] = useState({ utorid: '' });
  const [organizers, setOrganizers] = useState([]);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/events/${eventId}`);
      setEvent(response.data);
      setOrganizers(response.data.organizers || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Failed to load event details. Please try again later.');
      setLoading(false);
    }
  };

  const handleAddOrganizer = async (e) => {
    e.preventDefault();
    
    if (!organizerFormData.utorid.trim()) {
      setError('Please enter a valid UTORid.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    try {
      const response = await api.post(`/events/${eventId}/organizers`, {
        utorid: organizerFormData.utorid.trim()
      });
      
      setSuccessMessage(`${organizerFormData.utorid} has been added as an organizer successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      setOrganizerFormData({ utorid: '' });
      
      // Update the organizers list with the response data
      if (response.data.organizers) {
        setOrganizers(response.data.organizers);
      } else {
        fetchEvent(); // Fallback to re-fetching if response doesn't include organizers
      }
    } catch (err) {
      console.error('Error adding organizer:', err);
      setError(err.response?.data?.message || 'Failed to add organizer. Please check the UTORid and try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRemoveOrganizer = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this organizer?')) {
      return;
    }
    
    try {
      await api.delete(`/events/${eventId}/organizers/${userId}`);
      setSuccessMessage('Organizer removed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Update the organizer list
      setOrganizers(prev => prev.filter(organizer => organizer.id !== userId));
    } catch (err) {
      console.error('Error removing organizer:', err);
      setError(err.response?.data?.message || 'Failed to remove organizer. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrganizerFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-2 text-gray-700">Loading event details...</p>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
          <button 
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            onClick={() => navigate('/events/organizer')}
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Organizers: {event.name}</h1>
        <div>
          <button 
            onClick={() => navigate(`/events/manage/${eventId}`)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Back to Event
          </button>
        </div>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Add Organizer Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Add Organizer</h2>
          <form onSubmit={handleAddOrganizer}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">UTORid</label>
              <input
                type="text"
                name="utorid"
                value={organizerFormData.utorid}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter UTORid"
                required
              />
            </div>
            <button 
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full"
            >
              Add Organizer
            </button>
          </form>
          
          <div className="mt-6">
            <p className="text-gray-700">
              <span className="font-semibold">Current Organizers:</span> {organizers.length}
            </p>
            <p className="text-gray-700 mt-2">
              <span className="font-semibold">Event Status:</span>
              {new Date(event.endTime) < new Date() ? (
                <span className="text-red-600 ml-1">Ended</span>
              ) : new Date(event.startTime) > new Date() ? (
                <span className="text-blue-600 ml-1">Not Started</span>
              ) : (
                <span className="text-green-600 ml-1">In Progress</span>
              )}
            </p>
            <div className="mt-4">
              <p className="text-gray-700 text-sm">
                <strong>Note:</strong> Organizers cannot also be guests at the same event. Adding someone as an organizer will remove them from the guest list if they are currently registered.
              </p>
            </div>
          </div>
        </div>
        
        {/* Organizer List */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Current Organizers</h2>
          
          {organizers.length === 0 ? (
            <p className="text-gray-700 text-center py-8">No organizers assigned yet.</p>
          ) : (
            <div className="overflow-y-auto max-h-96">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UTORid</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {organizers.map(organizer => (
                    <tr key={organizer.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{organizer.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{organizer.utorid}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button 
                          onClick={() => handleRemoveOrganizer(organizer.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventOrganizersPage;