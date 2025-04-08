// pages/events/EventDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const EventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { currentUser, isManager } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rsvpLoading, setRsvpLoading] = useState(false);
  
  // Check if the current user has RSVP'd
  const [hasRsvp, setHasRsvp] = useState(false);
  
  // Check if user is an organizer
  const [isOrganizer, setIsOrganizer] = useState(false);
  
  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);
  
  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await eventService.getEvent(eventId);
      setEvent(response.data);
      
      // Check if current user is in the guest list
      if (currentUser && response.data.guests) {
        setHasRsvp(response.data.guests.some(guest => guest.id === currentUser.id));
      }
      
      // Check if current user is an organizer
      if (currentUser && response.data.organizers) {
        setIsOrganizer(response.data.organizers.some(organizer => organizer.id === currentUser.id));
      }
    } catch (err) {
      setError('Failed to load event details: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  const handleRsvp = async () => {
    try {
      setRsvpLoading(true);
      setError('');
      
      await eventService.rsvpToEvent(eventId);
      
      setHasRsvp(true);
      setSuccess('You have successfully RSVP\'d to this event!');
      
      // Refresh event details to get updated guest count
      fetchEventDetails();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err.response?.status === 410) {
        setError('Sorry, this event is either full or has ended.');
      } else {
        setError('Failed to RSVP: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setRsvpLoading(false);
    }
  };
  
  const handleCancelRsvp = async () => {
    try {
      setRsvpLoading(true);
      setError('');
      
      await eventService.cancelRsvp(eventId);
      
      setHasRsvp(false);
      setSuccess('Your RSVP has been canceled.');
      
      // Refresh event details to get updated guest count
      fetchEventDetails();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err.response?.status === 410) {
        setError('The event has already ended, and RSVPs cannot be canceled.');
      } else if (err.response?.status === 404) {
        setError('You have not RSVP\'d to this event.');
      } else {
        setError('Failed to cancel RSVP: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setRsvpLoading(false);
    }
  };
  
  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Helper function to format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Helper function to determine event status
  const getEventStatus = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now < start) {
      return { status: 'upcoming', label: 'Upcoming', color: 'blue' };
    } else if (now >= start && now <= end) {
      return { status: 'active', label: 'Active', color: 'green' };
    } else {
      return { status: 'ended', label: 'Ended', color: 'gray' };
    }
  };
  
  // Check if the event is full
  const isEventFull = (event) => {
    if (!event.capacity) return false; // Unlimited capacity
    return event.numGuests >= event.capacity;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading event details...</div>
      </div>
    );
  }
  
  if (error && !event) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800">Error</h3>
            <div className="mt-2 text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate('/events')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Back to Events
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-yellow-800">Event Not Found</h3>
            <div className="mt-2 text-yellow-700">
              <p>The event you are looking for could not be found.</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate('/events')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Back to Events
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const eventStatus = getEventStatus(event.startTime, event.endTime);
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{event.name}</h1>
        <Link
          to="/events"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Events
        </Link>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
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
      
      {/* Success message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Event header */}
        <div className={`p-6 border-b ${
          eventStatus.status === 'active' ? 'bg-green-50 border-green-200' :
          eventStatus.status === 'upcoming' ? 'bg-blue-50 border-blue-200' :
          'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center">
                <span className={`mr-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-${eventStatus.color}-100 text-${eventStatus.color}-800`}>
                  {eventStatus.label}
                </span>
                {isEventFull(event) && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Full
                  </span>
                )}
                {isOrganizer && (
                  <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    You're an Organizer
                  </span>
                )}
                {hasRsvp && !isOrganizer && (
                  <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    RSVP'd
                  </span>
                )}
              </div>
              <h2 className="text-xl font-semibold mt-1">{event.name}</h2>
            </div>
            
            {!isOrganizer && eventStatus.status !== 'ended' && (
              <div>
                {hasRsvp ? (
                  <button
                    onClick={handleCancelRsvp}
                    disabled={rsvpLoading}
                    className={`px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                      rsvpLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {rsvpLoading ? 'Processing...' : 'Cancel RSVP'}
                  </button>
                ) : (
                  <button
                    onClick={handleRsvp}
                    disabled={rsvpLoading || isEventFull(event)}
                    className={`px-4 py-2 border border-transparent text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      (rsvpLoading || isEventFull(event)) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {rsvpLoading ? 'Processing...' : 'RSVP Now'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Event details */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">About This Event</h3>
              <p className="text-gray-600 mb-6 whitespace-pre-wrap">{event.description}</p>
              
              {isManager && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Points Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Total Points</div>
                      <div className="text-2xl font-semibold text-green-600">
                        {event.pointsAwarded} / {event.pointsRemain + event.pointsAwarded}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Remaining Points</div>
                      <div className="text-2xl font-semibold text-blue-600">
                        {event.pointsRemain}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Event Details</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Date & Time</div>
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="font-medium">
                      {formatDate(event.startTime)} at {formatTime(event.startTime)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 ml-6">
                    to {formatDate(event.endTime)} at {formatTime(event.endTime)}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Location</div>
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="font-medium">{event.location}</div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Capacity</div>
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656.126-1.283.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div className="font-medium">
                      {event.capacity ? `${event.numGuests}/${event.capacity}` : 'Unlimited'}
                    </div>
                  </div>
                </div>
                
                {(isManager || isOrganizer) && event.organizers && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Organizers</div>
                    <div className="ml-6">
                      <ul className="list-disc space-y-1">
                        {event.organizers.map(organizer => (
                          <li key={organizer.id} className="text-sm">
                            {organizer.name} ({organizer.utorid})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                {(isManager || isOrganizer) && event.guests && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Guests</div>
                    <div className="ml-6">
                      {event.guests.length > 0 ? (
                        <ul className="list-disc space-y-1">
                          {event.guests.map(guest => (
                            <li key={guest.id} className="text-sm">
                              {guest.name} ({guest.utorid})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No guests yet</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;