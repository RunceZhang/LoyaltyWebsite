// pages/promotions/PromotionListPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { promotionService } from '../../services/api';

const PromotionListPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchPromotions();
  }, []);
  
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await promotionService.getPromotions();
      setPromotions(response.data.results);
    } catch (err) {
      setError('Failed to load promotions: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Helper function to determine if a promotion is currently active
  const isActivePromotion = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    return now >= start && now <= end;
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Current Promotions</h1>
      
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
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading promotions...</div>
        </div>
      ) : promotions.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <div className="text-gray-600">No current promotions available.</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Automatic Promotions */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Rate Promotions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {promotions
                .filter(promotion => promotion.type === 'automatic')
                .map(promotion => (
                  <div
                    key={promotion.id}
                    className={`bg-white shadow rounded-lg overflow-hidden border-l-4 ${
                      isActivePromotion(promotion.startTime, promotion.endTime)
                        ? 'border-green-500'
                        : 'border-gray-300'
                    }`}
                  >
                    <div className="p-4 bg-blue-50">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg">{promotion.name}</h3>
                        {isActivePromotion(promotion.startTime, promotion.endTime) ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                            Upcoming
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <p className="text-gray-600 text-sm mb-4">{promotion.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Bonus Rate:</span>
                          <span className="text-sm font-medium">{promotion.rate} points per $1</span>
                        </div>
                        
                        {promotion.minSpending && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Minimum Spending:</span>
                            <span className="text-sm font-medium">${promotion.minSpending.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Valid Until:</span>
                          <span className="text-sm font-medium">{formatDate(promotion.endTime)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            
            {promotions.filter(promotion => promotion.type === 'automatic').length === 0 && (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <div className="text-gray-600">No rate promotions available.</div>
              </div>
            )}
          </div>
          
          {/* One-time Promotions */}
          <div>
            <h2 className="text-xl font-semibold mb-4">One-Time Promotions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {promotions
                .filter(promotion => promotion.type === 'one-time')
                .map(promotion => (
                  <div
                    key={promotion.id}
                    className={`bg-white shadow rounded-lg overflow-hidden border-l-4 ${
                      isActivePromotion(promotion.startTime, promotion.endTime)
                        ? 'border-purple-500'
                        : 'border-gray-300'
                    }`}
                  >
                    <div className="p-4 bg-purple-50">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg">{promotion.name}</h3>
                        {isActivePromotion(promotion.startTime, promotion.endTime) ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                            Upcoming
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <p className="text-gray-600 text-sm mb-4">{promotion.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Bonus Points:</span>
                          <span className="text-sm font-medium">+{promotion.points} points</span>
                        </div>
                        
                        {promotion.minSpending && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Minimum Spending:</span>
                            <span className="text-sm font-medium">${promotion.minSpending.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Valid Until:</span>
                          <span className="text-sm font-medium">{formatDate(promotion.endTime)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            
            {promotions.filter(promotion => promotion.type === 'one-time').length === 0 && (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <div className="text-gray-600">No one-time promotions available.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionListPage;