// pages/transactions/RedemptionTransactionForm.js
import React, { useState } from 'react';
import { transactionService } from '../../services/api';
import { RedemptionQRCode } from '../../components/qrcode/QRCodeComponents';

const RedemptionTransactionForm = ({ currentUser, setMode, onSuccess, onError }) => {
  // State for redemption transaction
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [redemptionRemark, setRedemptionRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdRedemption, setCreatedRedemption] = useState(null);

  // Function to handle redemption form submission
  const handleRedemptionSubmit = async (e) => {
    e.preventDefault();
    
    const points = parseInt(pointsToRedeem);
    if (isNaN(points) || points <= 0) {
      onError('Please enter a valid positive number of points to redeem');
      return;
    }
    
    if (points > currentUser.points) {
      onError('You cannot redeem more points than you have available');
      return;
    }
    
    try {
      setLoading(true);
      onError('');
      
      const redemptionData = {
        amount: points,
        remark: redemptionRemark
      };
      
      const response = await transactionService.createRedemption(redemptionData);
      
      // Store the created redemption for QR code display
      setCreatedRedemption(response.data);
      
      // Reset form
      setPointsToRedeem('');
      setRedemptionRemark('');
      
      onSuccess(`Redemption request created successfully! Show the QR code to a cashier to process your redemption.`);
    } catch (err) {
      onError('Failed to create redemption request: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // If a redemption was already created, show QR code
  if (createdRedemption) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Redemption Request Created</h2>
        </div>
        
        <div className="p-6 text-center">
          <div className="mb-4">
            <p className="text-lg font-medium">Your redemption request has been created!</p>
            <p className="text-gray-600">Show this QR code to a cashier to process your redemption.</p>
          </div>
          
          <div className="flex justify-center my-8">
            <RedemptionQRCode transaction={createdRedemption} />
          </div>
          
          <div className="mt-6 bg-gray-50 p-4 rounded-lg text-left">
            <h3 className="font-medium mb-2">Redemption Details</h3>
            <p className="text-sm text-gray-600">Transaction ID: {createdRedemption.id}</p>
            <p className="text-sm text-gray-600">Points to Redeem: {Math.abs(createdRedemption.amount)}</p>
            <p className="text-sm text-gray-600">Status: Awaiting Processing</p>
            {createdRedemption.remark && (
              <p className="text-sm text-gray-600">Remark: {createdRedemption.remark}</p>
            )}
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => setMode('')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Transaction Options
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="bg-blue-600 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">Redeem Points</h2>
      </div>
      
      <div className="p-6">
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium">Current Balance</h3>
          <p className="text-2xl font-bold text-blue-600">{currentUser.points} points</p>
          <p className="text-sm text-gray-600 mt-1">1 point = $0.01 in value</p>
        </div>
        
        <form onSubmit={handleRedemptionSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="pointsToRedeem" className="block text-sm font-medium text-gray-700 mb-1">
                Points to Redeem
              </label>
              <input
                type="number"
                id="pointsToRedeem"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={pointsToRedeem}
                onChange={(e) => setPointsToRedeem(e.target.value)}
                required
                min="1"
                max={currentUser.points}
              />
              {pointsToRedeem && !isNaN(parseInt(pointsToRedeem)) && (
                <p className="mt-1 text-sm text-gray-500">
                  Value: ${(parseInt(pointsToRedeem) * 0.01).toFixed(2)}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="redemptionRemark" className="block text-sm font-medium text-gray-700 mb-1">
                Remark (Optional)
              </label>
              <textarea
                id="redemptionRemark"
                rows={2}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={redemptionRemark}
                onChange={(e) => setRedemptionRemark(e.target.value)}
                placeholder="Add any additional notes"
              ></textarea>
            </div>
            
            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setMode('')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !pointsToRedeem || isNaN(parseInt(pointsToRedeem)) || parseInt(pointsToRedeem) <= 0 || parseInt(pointsToRedeem) > currentUser.points}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  (loading || !pointsToRedeem || isNaN(parseInt(pointsToRedeem)) || parseInt(pointsToRedeem) <= 0 || parseInt(pointsToRedeem) > currentUser.points) ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Processing...' : 'Create Redemption Request'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RedemptionTransactionForm;