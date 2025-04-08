// pages/transactions/TransactionOptions.js
import React from 'react';
import { Link } from 'react-router-dom';

const TransactionOptions = ({ currentUser, isCashier, isManager, setMode, navigate }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Select Transaction Type</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentUser.verified && (
          <>
            <button
              onClick={() => setMode('redemption')}
              className="p-6 border-2 border-blue-200 rounded-lg text-center hover:bg-blue-50 transition duration-200"
            >
              <div className="mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium">Redeem Points</h3>
              <p className="text-sm text-gray-500 mt-1">Create a redemption request to use your points</p>
            </button>
            
            <button
              onClick={() => setMode('transfer')}
              className="p-6 border-2 border-green-200 rounded-lg text-center hover:bg-green-50 transition duration-200"
            >
              <div className="mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium">Transfer Points</h3>
              <p className="text-sm text-gray-500 mt-1">Send points to another user</p>
            </button>
          </>
        )}
        
        {isCashier && (
          <>
            <button
              onClick={() => setMode('purchase')}
              className="p-6 border-2 border-purple-200 rounded-lg text-center hover:bg-purple-50 transition duration-200"
            >
              <div className="mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium">Record Purchase</h3>
              <p className="text-sm text-gray-500 mt-1">Create a purchase transaction for a customer</p>
            </button>
            
            <button
              onClick={() => setMode('process')}
              className="p-6 border-2 border-indigo-200 rounded-lg text-center hover:bg-indigo-50 transition duration-200"
            >
              <div className="mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium">Process Redemption</h3>
              <p className="text-sm text-gray-500 mt-1">Process a customer's redemption request</p>
            </button>
          </>
        )}
        
        {isManager && (
          <button
            onClick={() => setMode('adjustment')}
            className="p-6 border-2 border-yellow-200 rounded-lg text-center hover:bg-yellow-50 transition duration-200"
          >
            <div className="mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium">Create Adjustment</h3>
            <p className="text-sm text-gray-500 mt-1">Adjust points for a transaction</p>
          </button>
        )}
        
        <button
          onClick={() => navigate('/transactions/history')}
          className="p-6 border-2 border-gray-200 rounded-lg text-center hover:bg-gray-50 transition duration-200"
        >
          <div className="mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium">Transaction History</h3>
          <p className="text-sm text-gray-500 mt-1">View your transaction history</p>
        </button>
      </div>
      
      {!currentUser.verified && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Account not verified</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Your account needs to be verified by a manager before you can redeem or transfer points. Please contact a manager for assistance.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionOptions;