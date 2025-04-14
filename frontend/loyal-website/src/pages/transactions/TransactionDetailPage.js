// pages/transactions/TransactionDetailPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { transactionService } from '../../services/api';

const TransactionDetailPage = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const { isManager, isCashier } = useAuth();
  
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // For manager action - marking as suspicious/not suspicious
  const [changingSuspiciousStatus, setChangingSuspiciousStatus] = useState(false);

  const fetchTransaction = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = isManager
        ? await transactionService.getTransaction(transactionId)
        : await transactionService.getUserTransactions({ 
            relatedId: transactionId, 
            type: 'adjustment'
          });
      
      if (isManager) {
        setTransaction(response.data);
      } else {
        // For regular users, find the main transaction and any adjustments
        const adjustments = response.data.results || [];
        
        // Get the main transaction
        const mainTransactionResponse = await transactionService.getUserTransactions({
          limit: 1,
          page: 1
        });
        
        const mainTransaction = mainTransactionResponse.data.results.find(
          t => t.id === parseInt(transactionId)
        );
        
        if (!mainTransaction) {
          throw new Error('Transaction not found');
        }
        
        setTransaction({
          ...mainTransaction,
          adjustments
        });
      }
    } catch (err) {
      setError('Failed to load transaction: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [transactionId, isManager]);

  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  const handleToggleSuspicious = async () => {
    if (!isManager || !transaction) return;
    
    try {
      setChangingSuspiciousStatus(true);
      setError('');
      
      // Toggle the suspicious flag
      const newStatus = !transaction.suspicious;
      
      await transactionService.updateTransactionSuspicious(
        transaction.id,
        newStatus
      );
      
      setTransaction({
        ...transaction,
        suspicious: newStatus
      });
      
      setSuccess(`Transaction marked as ${newStatus ? 'suspicious' : 'not suspicious'}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError('Failed to update transaction status: ' + (err.response?.data?.message || err.message));
    } finally {
      setChangingSuspiciousStatus(false);
    }
  };

  const handleProcessRedemption = async () => {
    if (!isCashier || !transaction || transaction.type !== 'redemption' || transaction.processedBy) return;
    
    try {
      setLoading(true);
      setError('');
      
      await transactionService.processRedemption(transaction.id);
      
      // Refresh transaction data
      fetchTransaction();
      
      setSuccess('Redemption processed successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError('Failed to process redemption: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Helper function to format transaction type
  const formatTransactionType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Helper function to format monetary value
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Helper function to generate transaction details based on type
  const getTransactionDetails = () => {
    if (!transaction) return null;
    
    switch (transaction.type) {
      case 'purchase':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Amount Spent</div>
              <div className="font-medium">{formatCurrency(transaction.spent)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Points Earned</div>
              <div className="font-medium text-green-600">+{transaction.amount}</div>
            </div>
            {transaction.promotionIds && transaction.promotionIds.length > 0 && (
              <div className="col-span-2">
                <div className="text-sm text-gray-500 mb-1">Promotions Applied</div>
                <div className="flex flex-wrap gap-2">
                  {transaction.promotionIds.map(promotionId => (
                    <span 
                      key={promotionId}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      Promotion #{promotionId}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      case 'redemption':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Points Redeemed</div>
              <div className="font-medium text-red-600">{transaction.amount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Value</div>
              <div className="font-medium">{formatCurrency(Math.abs(transaction.amount) * 0.01)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Status</div>
              <div className="font-medium">
                {transaction.processedBy ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Processed by {transaction.processedBy}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Awaiting Processing
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'adjustment':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Points Adjusted</div>
              <div className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {transaction.amount >= 0 ? '+' : ''}{transaction.amount}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Related Transaction</div>
              <div className="font-medium">
                <Link to={`/transactions/${transaction.relatedId}`} className="text-blue-600 hover:text-blue-800">
                  #{transaction.relatedId}
                </Link>
              </div>
            </div>
          </div>
        );
      
      case 'transfer':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Points Transferred</div>
              <div className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {transaction.amount >= 0 ? '+' : ''}{transaction.amount}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">
                {transaction.amount >= 0 ? 'From User' : 'To User'}
              </div>
              <div className="font-medium">
                User #{transaction.relatedId}
              </div>
            </div>
          </div>
        );
      
      case 'event':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Points Awarded</div>
              <div className="font-medium text-green-600">+{transaction.amount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Event</div>
              <div className="font-medium">
                Event #{transaction.relatedId}
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div>
            <div className="text-sm text-gray-500 mb-1">Points</div>
            <div className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {transaction.amount >= 0 ? '+' : ''}{transaction.amount}
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading transaction details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800">Error</h3>
            <div className="mt-2 text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate('/transactions/history')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Back to Transactions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-yellow-800">Transaction Not Found</h3>
            <div className="mt-2 text-yellow-700">
              <p>The transaction you are looking for could not be found.</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate('/transactions/history')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Back to Transactions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Transaction #{transaction.id}: {formatTransactionType(transaction.type)}
        </h1>
        <button
          onClick={() => navigate('/transactions/history')}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Transactions
        </button>
      </div>
      
      {/* Success message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Transaction details */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className={`p-4 border-b border-gray-200 
          ${transaction.type === 'purchase' ? 'bg-green-50' :
            transaction.type === 'redemption' ? 'bg-blue-50' :
            transaction.type === 'adjustment' ? 'bg-yellow-50' :
            transaction.type === 'transfer' ? 'bg-purple-50' :
            transaction.type === 'event' ? 'bg-indigo-50' : 'bg-gray-50'}`
        }>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className={`mr-2 px-2.5 py-0.5 rounded-full text-xs font-medium 
                ${transaction.type === 'purchase' ? 'bg-green-100 text-green-800' :
                  transaction.type === 'redemption' ? 'bg-blue-100 text-blue-800' :
                  transaction.type === 'adjustment' ? 'bg-yellow-100 text-yellow-800' :
                  transaction.type === 'transfer' ? 'bg-purple-100 text-purple-800' :
                  transaction.type === 'event' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`
              }>
                {formatTransactionType(transaction.type)}
              </span>
              <h2 className="text-lg font-semibold">
                Transaction Details
              </h2>
            </div>
            
            {isManager && transaction.type === 'purchase' && (
              <div>
                <button
                  onClick={handleToggleSuspicious}
                  disabled={changingSuspiciousStatus}
                  className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${
                    transaction.suspicious
                      ? 'border-green-300 text-green-700 bg-green-100 hover:bg-green-200'
                      : 'border-red-300 text-red-700 bg-red-100 hover:bg-red-200'
                  } ${changingSuspiciousStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {changingSuspiciousStatus ? 'Updating...' : (
                    transaction.suspicious
                      ? 'Mark as Not Suspicious'
                      : 'Mark as Suspicious'
                  )}
                </button>
              </div>
            )}
            
            {isCashier && transaction.type === 'redemption' && !transaction.processedBy && (
              <div>
                <button
                  onClick={handleProcessRedemption}
                  disabled={loading}
                  className={`inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md shadow-sm text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Processing...' : 'Process Redemption'}
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Information</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Transaction ID</div>
                  <div className="font-medium">{transaction.id}</div>
                </div>
                
                {isManager && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">User</div>
                    <div className="font-medium">{transaction.utorid}</div>
                  </div>
                )}
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Created By</div>
                  <div className="font-medium">{transaction.createdBy}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Date</div>
                  <div className="font-medium">{formatDate(transaction.createdAt)}</div>
                </div>
                
                {transaction.remark && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Remark</div>
                    <div className="font-medium">{transaction.remark}</div>
                  </div>
                )}
                
                {isManager && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Status</div>
                    <div className="font-medium">
                      {transaction.suspicious ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Suspicious
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Details</h3>
              {getTransactionDetails()}
            </div>
          </div>
          
          {/* Related adjustments (if any) */}
          {transaction.adjustments && transaction.adjustments.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Related Adjustments</h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points Adjusted
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remark
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transaction.adjustments.map(adjustment => (
                      <tr key={adjustment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {adjustment.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={adjustment.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {adjustment.amount >= 0 ? '+' : ''}{adjustment.amount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {adjustment.createdBy}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(adjustment.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {adjustment.remark || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailPage;