// pages/promotions/PromotionListPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { promotionService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const PromotionListPage = () => {
  const { isManager } = useAuth();
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const isActivePromotion = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    return now >= start && now <= end;
  };

  const renderPromotionCard = (promotion, color) => {
    const card = (
        <div
            className={`bg-white shadow rounded-lg overflow-hidden border-l-4 ${
                isActivePromotion(promotion.startTime, promotion.endTime)
                    ? `border-${color}-500`
                    : 'border-gray-300'
            }`}
        >
          <div className={`p-4 bg-${color}-50`}>
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">{promotion.name}</h3>
              {isActivePromotion(promotion.startTime, promotion.endTime) ? (
                  <span className={`px-2 py-1 bg-${color}-100 text-${color}-800 text-xs font-semibold rounded-full`}>
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

            <div className="space-y-2 text-sm">
              {promotion.type === 'automatic' ? (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bonus Rate:</span>
                    <span className="font-medium">{promotion.rate} points per $1</span>
                  </div>
              ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bonus Points:</span>
                    <span className="font-medium">+{promotion.points} points</span>
                  </div>
              )}

              {promotion.minSpending && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Minimum Spending:</span>
                    <span className="font-medium">${promotion.minSpending.toFixed(2)}</span>
                  </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-500">Valid Until:</span>
                <span className="font-medium">{formatDate(promotion.endTime)}</span>
              </div>
            </div>
          </div>
        </div>
    );

    // Wrap in <Link> only if manager
    return isManager ? (
        <Link
            to={`/promotions/${promotion.id}`}
            key={promotion.id}
            className="block hover:shadow-lg transition-shadow duration-200"
        >
          {card}
        </Link>
    ) : (
        <div key={promotion.id}>{card}</div>
    );
  };

  return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Current Promotions</h1>

        {isManager && (
            <div className="mb-6">
              <Link to="/promotions/new">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Create Promotion</button>
              </Link>
            </div>
        )}

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
                      .filter(p => p.type === 'automatic')
                      .map(p => renderPromotionCard(p, 'green'))}
                </div>

                {promotions.filter(p => p.type === 'automatic').length === 0 && (
                    <div className="bg-white shadow rounded-lg p-6 text-center">
                      <div className="text-gray-600">No rate promotions available.</div>
                    </div>
                )}
              </div>

              {/* One-Time Promotions */}
              <div>
                <h2 className="text-xl font-semibold mb-4">One-Time Promotions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {promotions
                      .filter(p => p.type === 'one-time')
                      .map(p => renderPromotionCard(p, 'purple'))}
                </div>

                {promotions.filter(p => p.type === 'one-time').length === 0 && (
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
