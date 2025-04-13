import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const EventGuestsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { isManager } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [guestFormData, setGuestFormData] = useState({ utorid: '' });
  const [guests, setGuests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGuests, setFilteredGuests] = useState([]);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    if (guests.length > 0 && searchQuery) {
      setFilteredGuests(guests.filter(guest => 
        guest.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        guest.utorid.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } else {
      setFilteredGuests(guests);
    }
  }, [guests, searchQuery]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/events/${eventId}`);
      setEvent(response.data);
      setGuests(response.data.guests || []);
      setFilteredGuests(response.data.guests || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Failed to load event details. Please try again later.');
      setLoading(false);
    }
  };

  const handleAddGuest = async (e) => {
    e.preventDefault();
    
    if (!guestFormData.utorid.trim()) {
      setError('Please enter a valid UTORid.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    try {
      const response = await api.post(`/events/${eventId}/guests`, {
        utorid: guestFormData.utorid.trim()
      });
      
      // Add the new guest to the list
      if (response.data.guestAdded) {
        setGuests(prev => [...prev, response.data.guestAdded]);
      }
      
      setSuccessMessage(`${guestFormData.utorid} has been added to the event successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      setGuestFormData({ utorid: '' });
      fetchEvent(); // Refresh the guest list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add guest. Either the event has ended or full, or that the UTORid doesn\'t exist.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRemoveGuest = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this guest?')) {
      return;
    }
    
    try {
      await api.delete(`/events/${eventId}/guests/${userId}`);
      setSuccessMessage('Guest removed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Update the guest list
      setGuests(prev => prev.filter(guest => guest.id !== userId));
    } catch (err) {
      console.error('Error removing guest:', err);
      setError(err.response?.data?.message || 'Failed to remove guest. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGuestFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
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
        <h1 className="text-2xl font-bold">Manage Guests: {event.name}</h1>
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
        {/* Add Guest Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Add Guest</h2>
          <form onSubmit={handleAddGuest}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">UTORid</label>
              <input
                type="text"
                name="utorid"
                value={guestFormData.utorid}
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
              Add Guest
            </button>
          </form>
          
          <div className="mt-6">
            <p className="text-gray-700">
              <span className="font-semibold">Event Capacity:</span> {event.capacity ? `${guests.length}/${event.capacity}` : `${guests.length} (No limit)`}
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
          </div>
        </div>
        
        {/* Guest List */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Guest List ({guests.length})</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="p-2 pr-8 border border-gray-300 rounded"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          {filteredGuests.length === 0 ? (
            <p className="text-gray-700 text-center py-8">No guests found.</p>
          ) : (
            <div className="overflow-y-auto max-h-96">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UTORid</th>
                    {isManager && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGuests.map(guest => (
                    <tr key={guest.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{guest.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{guest.utorid}</td>
                      {isManager && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button 
                            onClick={() => handleRemoveGuest(guest.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      )}
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

export default EventGuestsPage;