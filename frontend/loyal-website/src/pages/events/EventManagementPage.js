import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const EventManagementPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { isManager } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    capacity: '',
    points: '',
    published: false
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/events/${eventId}`);
      setEvent(response.data);
      setFormData({
        name: response.data.name,
        description: response.data.description,
        location: response.data.location,
        startTime: new Date(response.data.startTime).toISOString().slice(0, 16),
        endTime: new Date(response.data.endTime).toISOString().slice(0, 16),
        capacity: response.data.capacity || '',
        points: response.data.pointsRemain + response.data.pointsAwarded || '',
        published: response.data.published || false
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Failed to load event details. Please try again later.');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Format data for API
    const updateData = {
      name: formData.name,
      description: formData.description,
      location: formData.location,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
      capacity: formData.capacity ? Number(formData.capacity) : null
    };
    
    // Only include points if user is a manager
    if (isManager) {
      updateData.points = Number(formData.points);
      updateData.published = formData.published;
    }
    
    try {
      const response = await api.patch(`/events/${eventId}`, updateData);
      
      // Update the local event state with the new data
      setEvent(prev => ({
        ...prev,
        ...response.data
      }));
      
      setSuccessMessage('Event updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsEditing(false);
      fetchEvent(); // Refresh the data
    } catch (err) {
      console.error('Error updating event:', err);
      if (err.response?.status === 400) {
        setError('Can\'t edit event that is already ended.');
      } else {
        setError(err.response?.data?.message || 'Failed to update event. Please try again.');
      }
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this event? This action cannot be undone.');

    if (!confirmDelete) return;

    try {
      await api.delete(`/events/${eventId}`);
      navigate('/events/organizer');
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event. Please try again later.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const formatDateTime = (dateTimeStr) => {
    return new Date(dateTimeStr).toLocaleString();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-2 text-gray-700">Loading event details...</p>
      </div>
    );
  }

  if (error) {
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
        <h1 className="text-2xl font-bold">Event Management</h1>
        <div className="flex space-x-2">
          <button
              onClick={() => navigate('/events/organizer')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Back to Events
          </button>

          {!isEditing ? (
              <>
                <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Edit Event
                </button>
                {isManager && (
                    <button
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                    >
                      Delete Event
                    </button>
                )}
              </>
          ) : (
              <button
                  onClick={() => {
                    setIsEditing(false);
                    fetchEvent();
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {!isEditing ? (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">{event.name}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Details</h3>
                <p className="text-gray-700 mb-2"><span className="font-semibold">Description:</span> {event.description}</p>
                <p className="text-gray-700 mb-2"><span className="font-semibold">Location:</span> {event.location}</p>
                <p className="text-gray-700 mb-2"><span className="font-semibold">Start Time:</span> {formatDateTime(event.startTime)}</p>
                <p className="text-gray-700 mb-2"><span className="font-semibold">End Time:</span> {formatDateTime(event.endTime)}</p>
                <p className="text-gray-700 mb-2">
                  <span className="font-semibold">Capacity:</span> {event.capacity ? event.capacity : 'No limit'}
                </p>
                <p className="text-gray-700 mb-2">
                  <span className="font-semibold">Current Guests:</span> {event.guests?.length || 0}
                </p>
                <p className="text-gray-700 mb-2">
                  <span className="font-semibold">Points Remaining:</span> {event.pointsRemain}
                </p>
                <p className="text-gray-700 mb-2">
                  <span className="font-semibold">Points Awarded:</span> {event.pointsAwarded}
                </p>
                <p className="text-gray-700 mb-2">
                  <span className="font-semibold">Status:</span> 
                  {event.published ? 
                    <span className="text-green-600 ml-1">Published</span> : 
                    <span className="text-red-600 ml-1">Not Published</span>}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Organizers</h3>
                {event.organizers?.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {event.organizers.map(organizer => (
                      <li key={organizer.id} className="mb-1">
                        {organizer.name} ({organizer.utorid})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700">No organizers assigned yet.</p>
                )}
                
                <h3 className="text-lg font-medium mt-6 mb-2">Guests</h3>
                {event.guests?.length > 0 ? (
                  <ul className="list-disc pl-5 max-h-40 overflow-y-auto">
                    {event.guests.map(guest => (
                      <li key={guest.id} className="mb-1">
                        {guest.name} ({guest.utorid})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700">No guests have RSVPed yet.</p>
                )}
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <button 
                  onClick={() => navigate(`/events/guests/${eventId}`)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full"
                >
                  Add Guests
                </button>
              </div>
              <div>
                <button 
                  onClick={() => navigate(`/events/award/${eventId}`)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded w-full"
                >
                  Award Points
                </button>
              </div>
              {isManager && (
                <div>
                  <button 
                    onClick={() => navigate(`/events/organizers/${eventId}`)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded w-full"
                  >
                    Manage Organizers
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (leave empty for no limit)</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  min="1"
                />
              </div>
              
              {isManager && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Points</label>
                  <input
                    type="number"
                    name="points"
                    value={formData.points}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    min="0"
                    required
                  />
                </div>
              )}
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  rows="4"
                  required
                ></textarea>
              </div>
              
              {isManager && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="published"
                    checked={formData.published}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700">Publish Event</label>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  // Reset form data to original values
                  fetchEvent();
                }}
                className="mr-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EventManagementPage;