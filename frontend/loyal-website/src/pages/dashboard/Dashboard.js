import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { transactionService, eventService, promotionService } from '../../services/api';
import { UserQRCode } from '../../components/qrcode/QRCodeComponents';

const Dashboard = () => {
  const { currentUser, isCashier, isManager } = useAuth();
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [activePromotions, setActivePromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch user's recent transactions
        const transactionsResponse = await transactionService.getUserTransactions({
          limit: 5
        });
        setRecentTransactions(transactionsResponse.data.results);

        // Fetch upcoming events
        const eventsResponse = await eventService.getEvents({
          started: false,
          limit: 3
        });
        setUpcomingEvents(eventsResponse.data.results);

        // Fetch active promotions if not a regular user
        if (isManager) {
          const promotionsResponse = await promotionService.getPromotions({
            ended: false,
            limit: 3
          });
          setActivePromotions(promotionsResponse.data.results);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isManager]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome, {currentUser?.name}</h1>
            <div className="flex items-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentUser?.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {currentUser?.verified ? 'Verified Account' : 'Unverified Account'}
              </span>
              <span className="ml-2 text-sm text-gray-500">Role: {currentUser?.role}</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-blue-600">{currentUser?.points || 0}</div>
              <div className="text-sm text-gray-600">Available Points</div>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={() => setShowQR(!showQR)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center"
            >
              {showQR ? 'Hide QR Code' : 'Show My QR Code'}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenorule" />
              </svg>
            </button>
          </div>
        </div>
        
        {showQR && (
          <div className="mt-6 flex justify-center">
            <UserQRCode />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/transactions"
              className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg text-center transition duration-200"
            >
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="font-medium">Transactions</div>
                <div className="text-xs text-gray-600 mt-1">View and manage</div>
              </div>
            </Link>
            
            <Link
              to="/events"
              className="bg-green-50 hover:bg-green-100 p-4 rounded-lg text-center transition duration-200"
            >
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="font-medium">Events</div>
                <div className="text-xs text-gray-600 mt-1">Browse and RSVP</div>
              </div>
            </Link>
            
            {isCashier && (
              <Link
                to="/register"
                className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg text-center transition duration-200"
              >
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <div className="font-medium">Register</div>
                  <div className="text-xs text-gray-600 mt-1">New users</div>
                </div>
              </Link>
            )}
            
            {isManager && (
              <Link
                to="/users"
                className="bg-yellow-50 hover:bg-yellow-100 p-4 rounded-lg text-center transition duration-200"
              >
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div className="font-medium">Users</div>
                  <div className="text-xs text-gray-600 mt-1">Manage users</div>
                </div>
              </Link>
            )}
            
            {isManager && (
              <Link
                to="/promotions"
                className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg text-center transition duration-200"
              >
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <div className="font-medium">Promotions</div>
                  <div className="text-xs text-gray-600 mt-1">Manage offers</div>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
            <Link to="/transactions/history" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
              View All
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map(transaction => (
                <Link 
                  key={transaction.id}
                  to={`/transactions/${transaction.id}`}
                  className="flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition duration-200"
                >
                  <div>
                    <div className="font-medium capitalize">
                      {transaction.type}
                      {transaction.type === 'purchase' && ` ($${transaction.spent?.toFixed(2)})`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount} points
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 text-gray-500 bg-gray-50 rounded-lg">
              No recent transactions found
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upcoming Events</h2>
            <Link to="/events" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
              View All
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map(event => (
                <Link 
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition duration-200"
                >
                  <div className="flex justify-between">
                    <div className="font-medium">{event.name}</div>
                    <div className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center">
                      {event.numGuests}/{event.capacity || '∞'} 
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{event.location}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(event.startTime).toLocaleDateString()} {new Date(event.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 text-gray-500 bg-gray-50 rounded-lg">
              No upcoming events found
            </div>
          )}
        </div>

        {/* Active Promotions (only for managers) */}
        {isManager && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Active Promotions</h2>
              <Link to="/promotions" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                View All
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            {activePromotions.length > 0 ? (
              <div className="space-y-3">
                {activePromotions.map(promotion => (
                  <Link
                    key={promotion.id}
                    to={`/promotions/${promotion.id}`}
                    className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition duration-200"
                  >
                    <div className="font-medium">{promotion.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {promotion.type === 'automatic' 
                        ? `Rate: ${promotion.rate} points per $1` 
                        : `${promotion.points} bonus points`}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs text-gray-500">
                        Ends: {new Date(promotion.endTime).toLocaleDateString()}
                      </div>
                      <div className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                        {promotion.type}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-gray-500 bg-gray-50 rounded-lg">
                No active promotions found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;