// pages/events/EventListPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../../services/api';

const EventListPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for filters
  const [filters, setFilters] = useState({
    name: '',
    location: '',
    started: false,
    ended: false,
    showFull: false,
  });
  
  useEffect(() => {
    fetchEvents();
  }, []);
  
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Parse filters
      const params = { ...filters };
      
      // Remove empty string filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });

    
    if (params.started === false && params.ended === false) {
      // If both are false, remove both as they're the default state
      delete params.started;
      delete params.ended;
    } else if (params.started === false) {
      // If only started is false (default), remove it
      delete params.started;
    } else if (params.ended === false) {
      // If only ended is false (default), remove it
      delete params.ended;
    }
    
    if (params.showFull === false) {
      delete params.showFull;
    }
      
      const response = await eventService.getEvents(params);
      setEvents(response.data.results);
    } catch (err) {
      setError('Failed to load events: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle filter submit
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
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
      return 'upcoming';
    } else if (now >= start && now <= end) {
      return 'active';
    } else {
      return 'ended';
    }
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Events</h1>
      
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
      
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        
        <form onSubmit={handleFilterSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Event Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={filters.name}
                onChange={handleFilterChange}
                placeholder="Search by name"
              />
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="Search by location"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  id="showFull"
                  name="showFull"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={filters.showFull}
                  onChange={handleFilterChange}
                />
                <label htmlFor="showFull" className="ml-2 block text-sm text-gray-700">
                  Show Full Events
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="started"
                  name="started"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={filters.started}
                  onChange={handleFilterChange}
                />
                <label htmlFor="started" className="ml-2 block text-sm text-gray-700">
                  Started Events Only
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="ended"
                  name="ended"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={filters.ended}
                  onChange={handleFilterChange}
                />
                <label htmlFor="ended" className="ml-2 block text-sm text-gray-700">
                  Past Events Only
                </label>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setFilters({
                  name: '',
                  location: '',
                  started: false,
                  ended: false,
                  showFull: false,
                });
              }}
              className="mr-3 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>
      
      {/* Events List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading events...</div>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <div className="text-gray-600">No events found matching your filters.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => {
            const status = getEventStatus(event.startTime, event.endTime);
            return (
              <Link 
                key={event.id}
                to={`/events/${event.id}`}
                className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div className={`p-4 border-b ${
                  status === 'active' ? 'bg-green-50 border-green-200' :
                  status === 'upcoming' ? 'bg-blue-50 border-blue-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">{event.name}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      status === 'active' ? 'bg-green-100 text-green-800' :
                      status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {status === 'active' ? 'Active' :
                       status === 'upcoming' ? 'Upcoming' : 'Ended'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="mb-4">
                    <div className="flex items-center text-gray-600 mb-2">
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm">{event.location}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">
                        {formatDate(event.startTime)} at {formatTime(event.startTime)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-2">
                    <span className="text-sm text-gray-500">
                      Capacity: {event.capacity ? `${event.numGuests}/${event.capacity}` : 'Unlimited'}
                    </span>
                    {event.capacity && event.numGuests >= event.capacity && (
                      <span className="text-xs font-medium text-red-600">
                        Full
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventListPage;