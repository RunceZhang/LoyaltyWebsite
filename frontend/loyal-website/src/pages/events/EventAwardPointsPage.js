import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const EventAwardPointsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [guests, setGuests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [awardAll, setAwardAll] = useState(false);
  const [pointsFormData, setPointsFormData] = useState({
    amount: '',
    remark: ''
  });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPointsFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleGuestSelect = (guest) => {
    setSelectedGuest(guest);
    setAwardAll(false);
  };

  const handleAwardAllToggle = () => {
    setAwardAll(!awardAll);
    setSelectedGuest(null);
  };

  const handleAwardPoints = async (e) => {
    e.preventDefault();
    
    if (!pointsFormData.amount || parseInt(pointsFormData.amount) <= 0) {
      setError('Please enter a valid positive point amount.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    try {
      const payload = {
        type: 'event',
        amount: parseInt(pointsFormData.amount),
        remark: pointsFormData.remark.trim() || undefined
      };
      
      // If we're awarding to a specific guest, include their utorid
      if (!awardAll && selectedGuest) {
        payload.utorid = selectedGuest.utorid;
      }
      
      const response = await api.post(`/events/${eventId}/transactions`, payload);
      
      setSuccessMessage(awardAll 
        ? `${pointsFormData.amount} points awarded to all guests successfully!` 
        : `${pointsFormData.amount} points awarded to ${selectedGuest.name} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Reset form
      setPointsFormData({ amount: '', remark: '' });
      setSelectedGuest(null);
      setAwardAll(false);
      
      // Refresh event data to get updated points remaining
      fetchEvent();
    } catch (err) {
      console.error('Error awarding points:', err);
      setError(err.response?.data?.message || 'Failed to award points. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
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
        <h1 className="text-2xl font-bold">Award Points: {event.name}</h1>
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
        {/* Award Points Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Award Points</h2>
          
          <div className="mb-6">
            <p className="text-gray-700">
              <span className="font-semibold">Points Remaining:</span> {event.pointsRemain}
            </p>
            <p className="text-gray-700 mt-2">
              <span className="font-semibold">Points Awarded:</span> {event.pointsAwarded}
            </p>
            <p className="text-gray-700 mt-2">
              <span className="font-semibold">Total Guests:</span> {guests.length}
            </p>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="awardAll"
                checked={awardAll}
                onChange={handleAwardAllToggle}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="awardAll" className="ml-2 text-sm font-medium text-gray-700">
                Award points to all guests
              </label>
            </div>
            
            {!awardAll && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selected Guest</label>
                {selectedGuest ? (
                  <div className="p-2 border border-gray-300 rounded flex justify-between items-center">
                    <span>
                      {selectedGuest.name} ({selectedGuest.utorid})
                    </span>
                    <button 
                      onClick={() => setSelectedGuest(null)}
                      className="text-red-600 hover:text-red-900"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="p-2 border border-gray-300 rounded text-gray-500">
                    No guest selected. Please select a guest from the list.
                  </div>
                )}
              </div>
            )}
          </div>
          
          <form onSubmit={handleAwardPoints}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Points to Award</label>
              <input
                type="number"
                name="amount"
                value={pointsFormData.amount}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter point amount"
                min="1"
                max={event.pointsRemain}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Remark (Optional)</label>
              <input
                type="text"
                name="remark"
                value={pointsFormData.remark}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="e.g., Prize winner, Active participant"
              />
            </div>
            
            <button 
              type="submit"
              disabled={!awardAll && !selectedGuest}
              className={`w-full px-4 py-2 rounded text-white ${
                (!awardAll && !selectedGuest) 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              Award Points
            </button>
          </form>
        </div>
        
        {/* Guest List */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Select Guest</h2>
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGuests.map(guest => (
                    <tr 
                      key={guest.id} 
                      className={selectedGuest?.id === guest.id ? 'bg-blue-50' : ''}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">{guest.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{guest.utorid}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button 
                          onClick={() => handleGuestSelect(guest)}
                          className={`${
                            selectedGuest?.id === guest.id
                              ? 'text-blue-700 font-semibold'
                              : 'text-blue-600 hover:text-blue-900'
                          }`}
                        >
                          {selectedGuest?.id === guest.id ? 'Selected' : 'Select'}
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

export default EventAwardPointsPage;