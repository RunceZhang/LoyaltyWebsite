// pages/promotions/PromotionCreatePage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { promotionService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const PromotionCreatePage = () => {
    const navigate = useNavigate();
    const { isManager } = useAuth();
    const [promotionData, setPromotionData] = useState({
        name: '',
        description: '',
        startTime: '',
        endTime: '',
        rate: '',
        minSpending: '',
        type: 'automatic',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setPromotionData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await promotionService.createPromotion(promotionData);
            setSuccess('Promotion created successfully!');
            // Redirect to the promotion list page after successful creation
            navigate('/promotions');
        } catch (err) {
            setError('Failed to create promotion: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // If the user is not a manager, they should be redirected (or see a permission message)
    if (!isManager) {
        return <div>You do not have permission to create promotions.</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Create New Promotion</h1>

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

            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-green-800">{success}</p>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Promotion Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={promotionData.name}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={promotionData.description}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                        Start Time
                    </label>
                    <input
                        type="datetime-local"
                        id="startTime"
                        name="startTime"
                        value={promotionData.startTime}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                        End Time
                    </label>
                    <input
                        type="datetime-local"
                        id="endTime"
                        name="endTime"
                        value={promotionData.endTime}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="rate" className="block text-sm font-medium text-gray-700">
                        Bonus Rate
                    </label>
                    <input
                        type="number"
                        id="rate"
                        name="rate"
                        value={promotionData.rate}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        min="0"
                    />
                </div>

                <div>
                    <label htmlFor="minSpending" className="block text-sm font-medium text-gray-700">
                        Minimum Spending (Optional)
                    </label>
                    <input
                        type="number"
                        id="minSpending"
                        name="minSpending"
                        value={promotionData.minSpending}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        min="0"
                    />
                </div>

                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        Promotion Type
                    </label>
                    <select
                        id="type"
                        name="type"
                        value={promotionData.type}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                        <option value="automatic">Automatic</option>
                        <option value="one-time">One-Time</option>
                    </select>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full px-4 py-2 bg-blue-600 text-white rounded-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Creating...' : 'Create Promotion'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PromotionCreatePage;
