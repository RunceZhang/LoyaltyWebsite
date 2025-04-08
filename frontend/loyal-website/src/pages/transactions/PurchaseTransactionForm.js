// pages/transactions/PurchaseTransactionForm.js
import React, { useState } from 'react';
import { transactionService, userService } from '../../services/api';

const PurchaseTransactionForm = ({ setMode, onSuccess, onError }) => {
  // State for purchase transaction
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [utorid, setUtorid] = useState('');
  const [availablePromotions, setAvailablePromotions] = useState([]);
  const [selectedPromotions, setSelectedPromotions] = useState([]);
  const [purchaseRemark, setPurchaseRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannedUser, setScannedUser] = useState(null);

  // Function to fetch user details
  const fetchUserDetails = async (userUtorid) => {
    try {
      setLoading(true);
      onError('');
      
      const response = await userService.getUser(userUtorid);
      setScannedUser({
        ...response.data,
        utorid: userUtorid
      });
      
      // Set available promotions
      if (response.data.promotions) {
        setAvailablePromotions(response.data.promotions);
      }
    } catch (err) {
      onError('Failed to fetch user details: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Handle looking up a user by UTORID
  const handleLookupUser = () => {
    if (!utorid) {
      onError('Please enter a UTORID');
      return;
    }
    
    fetchUserDetails(utorid);
  };

  // Handle purchase form submission
  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    
    if (!utorid) {
      onError('Please enter a UTORID');
      return;
    }
    
    const spentAmount = parseFloat(purchaseAmount);
    if (isNaN(spentAmount) || spentAmount <= 0) {
      onError('Please enter a valid positive amount');
      return;
    }
    
    try {
      setLoading(true);
      onError('');
      
      const purchaseData = {
        utorid,
        spent: spentAmount,
        remark: purchaseRemark,
        promotionIds: selectedPromotions
      };
      
      const response = await transactionService.createPurchase(purchaseData);
      
      // Reset form
      setPurchaseAmount('');
      setUtorid('');
      setPurchaseRemark('');
      setSelectedPromotions([]);
      setAvailablePromotions([]);
      setScannedUser(null);
      
      onSuccess(`Purchase transaction created successfully! The user earned ${response.data.earned} points.`);
    } catch (err) {
      onError('Failed to create purchase transaction: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="bg-purple-600 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">Record Purchase Transaction</h2>
      </div>
      
      <div className="p-6">
        {/* Manual User Entry */}
        {!scannedUser && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Enter Customer Information</h3>
            <p className="text-sm text-gray-600 mb-4">Please enter the customer's UTORID to create a transaction.</p>
            
            <div className="flex">
              <input
                type="text"
                id="utorid"
                className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-l-md"
                value={utorid}
                onChange={(e) => setUtorid(e.target.value)}
                placeholder="Enter customer UTORID"
              />
              <button
                type="button"
                onClick={handleLookupUser}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-r-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Look up
              </button>
            </div>
          </div>
        )}
        
        {/* User info if found */}
        {scannedUser && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Customer Information</h3>
                <p className="text-sm text-gray-600">Name: {scannedUser.name}</p>
                <p className="text-sm text-gray-600">UTORID: {scannedUser.utorid}</p>
                <p className="text-sm text-gray-600">Points Balance: {scannedUser.points}</p>
              </div>
              <button
                onClick={() => {
                  setScannedUser(null);
                  setUtorid('');
                  setAvailablePromotions([]);
                  setSelectedPromotions([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Verification status warning */}
            {scannedUser && !scannedUser.verified && (
              <div className="mt-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                This user is not verified. They will still earn points, but cannot redeem them until verified by a manager.
              </div>
            )}
          </div>
        )}
        
        {/* Purchase form */}
        <form onSubmit={handlePurchaseSubmit}>
          <div className="space-y-4">
            {/* Amount spent input */}
            <div>
              <label htmlFor="purchaseAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Amount ($)
              </label>
              <input
                type="number"
                id="purchaseAmount"
                step="0.01"
                min="0.01"
                className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            
            {/* Available promotions */}
            {availablePromotions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Promotions
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 p-3 rounded-md">
                  {availablePromotions.map(promotion => (
                    <div key={promotion.id} className="flex items-center">
                      <input
                        id={`promotion-${promotion.id}`}
                        name="promotions"
                        type="checkbox"
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        checked={selectedPromotions.includes(promotion.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPromotions([...selectedPromotions, promotion.id]);
                          } else {
                            setSelectedPromotions(selectedPromotions.filter(id => id !== promotion.id));
                          }
                        }}
                      />
                      <label htmlFor={`promotion-${promotion.id}`} className="ml-2 block text-sm text-gray-700">
                        {promotion.name} 
                        {promotion.minSpending && <span className="text-xs text-gray-500 ml-1">(Min: ${promotion.minSpending})</span>}
                        {promotion.points && <span className="text-xs text-green-600 ml-1">(+{promotion.points} points)</span>}
                        {promotion.rate && <span className="text-xs text-green-600 ml-1">(+{promotion.rate} points per $)</span>}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Remark input */}
            <div>
              <label htmlFor="purchaseRemark" className="block text-sm font-medium text-gray-700 mb-1">
                Remark (Optional)
              </label>
              <textarea
                id="purchaseRemark"
                rows={2}
                className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={purchaseRemark}
                onChange={(e) => setPurchaseRemark(e.target.value)}
                placeholder="Add any additional notes"
              ></textarea>
            </div>
            
            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setMode('')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !utorid || !purchaseAmount}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                  (loading || !utorid || !purchaseAmount) ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Processing...' : 'Create Purchase'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseTransactionForm;