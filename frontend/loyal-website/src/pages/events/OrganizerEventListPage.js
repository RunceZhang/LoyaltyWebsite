import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const OrganizerEventListPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isManager } = useAuth(); 
  const [filters, setFilters] = useState({
    name: '',
    location: '',
    started: '',
    ended: '',
    published: '',
    showFull: false,
    page: 1,
    limit: 10
  });
  const [totalEvents, setTotalEvents] = useState(0);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      // Create query params from filters
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== '' && filters[key] !== null) {
          queryParams.append(key, filters[key]);
        }
      });

      const response = await api.get(`/events?${queryParams.toString()}`);
      setEvents(response.data.results);
      setTotalEvents(response.data.count);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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

  const formatDateTime = (dateTimeStr) => {
    return new Date(dateTimeStr).toLocaleString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Events</h1>
        {isManager && (
          <Link 
            to="/events/create" 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Create New Event
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Search by name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Search by location"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="started"
              value={filters.started}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All</option>
              <option value="true">Started</option>
              <option value="false">Not Started</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ended</label>
            <select
              name="ended"
              value={filters.ended}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All</option>
              <option value="true">Ended</option>
              <option value="false">Not Ended</option>
            </select>
          </div>
          {isManager && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Published</label>
              <select
                name="published"
                value={filters.published}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">All</option>
                <option value="true">Published</option>
                <option value="false">Not Published</option>
              </select>
            </div>
          )}
          <div className="flex items-center mt-6">
            <input
              type="checkbox"
              name="showFull"
              checked={filters.showFull}
              onChange={handleFilterChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">Show Full Events</label>
          </div>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-700">Loading events...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-700">No events found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <div key={event.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{event.name}</h3>
                <p className="text-gray-600 mb-2">
                  <span className="font-semibold">Location:</span> {event.location}
                </p>
                <p className="text-gray-600 mb-2">
                  <span className="font-semibold">Start:</span> {formatDateTime(event.startTime)}
                </p>
                <p className="text-gray-600 mb-2">
                  <span className="font-semibold">End:</span> {formatDateTime(event.endTime)}
                </p>
                <p className="text-gray-600 mb-2">
                  <span className="font-semibold">Guests:</span> {event.numGuests} 
                  {event.capacity ? ` / ${event.capacity}` : ' (No limit)'}
                </p>
                {isManager && (
                  <p className="text-gray-600 mb-2">
                    <span className="font-semibold">Points Remaining:</span> {event.pointsRemain}
                  </p>
                )}
                {isManager && (
                  <p className="text-gray-600 mb-2">
                    <span className="font-semibold">Status:</span> 
                    {event.published ? 
                      <span className="text-green-600 ml-1">Published</span> : 
                      <span className="text-red-600 ml-1">Not Published</span>}
                  </p>
                )}
                <div className="mt-4">
                  <Link 
                    to={`/events/manage/${event.id}`} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded inline-block"
                  >
                    Manage Event
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalEvents > filters.limit && (
        <div className="flex justify-center mt-8">
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
              Page {filters.page} of {Math.ceil(totalEvents / filters.limit)}
            </div>
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page >= Math.ceil(totalEvents / filters.limit)}
              className={`px-4 py-2 rounded-r-md ${
                filters.page >= Math.ceil(totalEvents / filters.limit)
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300`}
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default OrganizerEventListPage;