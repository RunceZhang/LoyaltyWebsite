// pages/transactions/TransactionPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PurchaseTransactionForm from './PurchaseTransactionForm';
import RedemptionTransactionForm from './RedemptionTransactionForm';
import TransferTransactionForm from './TransferTransactionForm';
import ProcessRedemptionForm from './ProcessRedemptionForm';
import TransactionOptions from './TransactionOptions';

const TransactionPage = () => {
  const { currentUser, isCashier, isManager } = useAuth();
  const navigate = useNavigate();

  // States for various transaction modes
  const [mode, setMode] = useState(''); // '', 'purchase', 'redemption', 'transfer', 'adjustment', 'process'
  
  // Common states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Reset all forms when changing mode
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [mode]);

  // Handle success message
  const handleSuccess = (message) => {
    setSuccess(message);
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccess('');
    }, 5000);
  };

  // Handle error message
  const handleError = (message) => {
    setError(message);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Transactions</h1>
      
      {/* Error message */}
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
      
      {/* Render the appropriate form based on the selected mode */}
      {mode === '' && (
        <TransactionOptions 
          currentUser={currentUser}
          isCashier={isCashier}
          isManager={isManager}
          setMode={setMode}
          navigate={navigate}
        />
      )}
      
      {mode === 'purchase' && isCashier && (
        <PurchaseTransactionForm 
          setMode={setMode}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}
      
      {mode === 'redemption' && currentUser.verified && (
        <RedemptionTransactionForm 
          currentUser={currentUser}
          setMode={setMode}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}
      
      {mode === 'transfer' && currentUser.verified && (
        <TransferTransactionForm 
          currentUser={currentUser}
          setMode={setMode}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}
      
      {mode === 'process' && isCashier && (
        <ProcessRedemptionForm 
          setMode={setMode}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}
    </div>
  );
};

export default TransactionPage;