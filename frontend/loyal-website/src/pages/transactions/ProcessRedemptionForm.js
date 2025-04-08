// pages/transactions/ProcessRedemptionForm.js
import React, { useState } from 'react';
import { transactionService } from '../../services/api';

const ProcessRedemptionForm = ({ setMode, onSuccess, onError }) => {
  // State for processing redemption
  const [processingRedemptionId, setProcessingRedemptionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [redemptionDetails, setRedemptionDetails] = useState(null);
  
  // Function to look up a redemption transaction
  const handleLookupRedemption = async () => {
    if (!processingRedemptionId) {
      onError('Please enter a redemption transaction ID');
      return;
    }
    
    try {
      setLoading(true);
      onError('');
      
      const response = await transactionService.getTransaction(processingRedemptionId);
      
      // Check if it's a redemption transaction
      if (response.data.type !== 'redemption') {
        onError('The transaction ID provided is not for a redemption transaction');
        return;
      }
      
      // Check if it's already processed
      if (response.data.processedBy) {
        onError('This redemption has already been processed');
        return;
      }
      
      setRedemptionDetails(response.data);
    } catch (err) {
      onError('Failed to find redemption: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Function to process a redemption
  const handleProcessRedemption = async () => {
    if (!processingRedemptionId) {
      onError('Please enter a redemption transaction ID');
      return;
    }
    
    try {
      setLoading(true);
      onError('');
      
      await transactionService.processRedemption(processingRedemptionId);
      
      // Reset form
      setProcessingRedemptionId('');
      setRedemptionDetails(null);
      
      onSuccess('Redemption processed successfully!');
    } catch (err) {
      onError('Failed to process redemption: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="bg-indigo-600 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">Process Redemption</h2>
      </div>
      
      <div className="p-6">
        {/* Manual Redemption ID Entry */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Process Redemption Request</h3>
          <p className="text-sm text-gray-600 mb-4">Please enter the redemption transaction ID to process it.</p>
          
          <div className="flex mb-4">
            <input
              type="number"
              id="processingRedemptionId"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-l-md"
              value={processingRedemptionId}
              onChange={(e) => setProcessingRedemptionId(e.target.value)}
              placeholder="Enter redemption transaction ID"
              min="1"
            />
            <button
              type="button"
              onClick={handleLookupRedemption}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Look up
            </button>
          </div>
        </div>
        
        {/* Redemption info if found */}
        {redemptionDetails && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-3">Redemption Details</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Transaction ID: {redemptionDetails.id}</p>
              <p className="text-sm text-gray-600">User: {redemptionDetails.utorid}</p>
              <p className="text-sm text-gray-600">Points to Redeem: {Math.abs(redemptionDetails.amount)}</p>
              <p className="text-sm text-gray-600">Value: ${(Math.abs(redemptionDetails.amount) * 0.01).toFixed(2)}</p>
              <p className="text-sm text-gray-600">Created By: {redemptionDetails.createdBy}</p>
              {redemptionDetails.remark && (
                <p className="text-sm text-gray-600">Remark: {redemptionDetails.remark}</p>
              )}
            </div>
            
            <div className="mt-4">
              <button
                onClick={handleProcessRedemption}
                disabled={loading}
                className={`w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Processing...' : 'Process This Redemption'}
              </button>
            </div>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setMode('')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Transaction Options
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcessRedemptionForm;