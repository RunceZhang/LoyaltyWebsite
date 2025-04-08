// pages/transactions/TransferTransactionForm.js
import React, { useState } from 'react';
import { transactionService, userService } from '../../services/api';

const TransferTransactionForm = ({ currentUser, setMode, onSuccess, onError }) => {
  // State for transfer transaction
  const [recipientUtorid, setRecipientUtorid] = useState('');
  const [pointsToTransfer, setPointsToTransfer] = useState('');
  const [transferRemark, setTransferRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannedUser, setScannedUser] = useState(null);

  // Function to look up a user by UTORID
  const handleLookupUser = async () => {
    if (!recipientUtorid) {
      onError('Please enter a recipient UTORID');
      return;
    }
    
    try {
      setLoading(true);
      onError('');
      
      const response = await userService.getUser(recipientUtorid);
      setScannedUser({
        ...response.data,
        utorid: recipientUtorid
      });
    } catch (err) {
      onError('Failed to find recipient: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Function to handle transfer form submission
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    
    if (!recipientUtorid) {
      onError('Please enter the recipient\'s UTORID');
      return;
    }
    
    const points = parseInt(pointsToTransfer);
    if (isNaN(points) || points <= 0) {
      onError('Please enter a valid positive number of points to transfer');
      return;
    }
    
    if (points > currentUser.points) {
      onError('You cannot transfer more points than you have available');
      return;
    }
    
    try {
      setLoading(true);
      onError('');
      
      // Find the user ID from the UTORID
      const userResponse = await userService.getUser(recipientUtorid);
      const userId = userResponse.data.id;
      
      const transferData = {
        amount: points,
        remark: transferRemark
      };
      
      await transactionService.createTransfer(userId, transferData);
      
      // Reset form
      setRecipientUtorid('');
      setPointsToTransfer('');
      setTransferRemark('');
      setScannedUser(null);
      
      onSuccess(`Transfer of ${points} points to ${recipientUtorid} completed successfully!`);
    } catch (err) {
      onError('Failed to transfer points: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="bg-green-600 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">Transfer Points</h2>
      </div>
      
      <div className="p-6">
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h3 className="font-medium">Current Balance</h3>
          <p className="text-2xl font-bold text-green-600">{currentUser.points} points</p>
        </div>
        
        {/* Manual Recipient Entry */}
        {!scannedUser && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Enter Recipient's Information</h3>
            <div className="flex">
              <input
                type="text"
                id="recipientUtorid"
                className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-l-md"
                value={recipientUtorid}
                onChange={(e) => setRecipientUtorid(e.target.value)}
                placeholder="Enter recipient's UTORID"
              />
              <button
                type="button"
                onClick={handleLookupUser}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-r-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Look up
              </button>
            </div>
          </div>
        )}
        
        {/* Recipient info if found */}
        {scannedUser && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Recipient Information</h3>
                <p className="text-sm text-gray-600">Name: {scannedUser.name}</p>
                <p className="text-sm text-gray-600">UTORID: {scannedUser.utorid}</p>
              </div>
              <button
                onClick={() => {
                  setScannedUser(null);
                  setRecipientUtorid('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        <form onSubmit={handleTransferSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="pointsToTransfer" className="block text-sm font-medium text-gray-700 mb-1">
                Points to Transfer
              </label>
              <input
                type="number"
                id="pointsToTransfer"
                className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={pointsToTransfer}
                onChange={(e) => setPointsToTransfer(e.target.value)}
                required
                min="1"
                max={currentUser.points}
              />
            </div>
            
            <div>
              <label htmlFor="transferRemark" className="block text-sm font-medium text-gray-700 mb-1">
                Remark (Optional)
              </label>
              <textarea
                id="transferRemark"
                rows={2}
                className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={transferRemark}
                onChange={(e) => setTransferRemark(e.target.value)}
                placeholder="Add any additional notes"
              ></textarea>
            </div>
            
            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setMode('')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !recipientUtorid || !pointsToTransfer || isNaN(parseInt(pointsToTransfer)) || parseInt(pointsToTransfer) <= 0 || parseInt(pointsToTransfer) > currentUser.points}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                  (loading || !recipientUtorid || !pointsToTransfer || isNaN(parseInt(pointsToTransfer)) || parseInt(pointsToTransfer) <= 0 || parseInt(pointsToTransfer) > currentUser.points) ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Processing...' : 'Transfer Points'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferTransactionForm;