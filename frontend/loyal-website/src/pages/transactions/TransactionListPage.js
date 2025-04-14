// pages/transactions/TransactionListPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { transactionService } from '../../services/api';

const TransactionListPage = () => {
  const { isManager } = useAuth(); 

  const navigate = useNavigate();
  // State for transactions
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  
  // State for pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10); 
  
  // State for filters
  const [filters, setFilters] = useState({
    type: '',
    promotionId: '',
    amount: '',
    operator: 'gte',
  });
  
  // For manager view
  const [managerFilters, setManagerFilters] = useState({
    name: '',
    createdBy: '',
    suspicious: '',
  });
  
  // Function to load transactions
  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Prepare filters
      const params = {
        page,
        limit,
        ...filters,
      };
      
      // Add manager filters if user is a manager
      if (isManager) {
        params.name = managerFilters.name;
        params.createdBy = managerFilters.createdBy;
        if (managerFilters.suspicious !== '') {
          params.suspicious = managerFilters.suspicious === 'true';
        }
      }
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });
      
      // If amount is set, operator is required
      if (params.amount && !params.operator) {
        params.operator = 'gte';
      }
      
      // Fetch transactions
      const response = isManager
        ? await transactionService.getAllTransactions(params)
        : await transactionService.getUserTransactions(params);
      
      setTransactions(response.data.results);
      setTotalCount(response.data.count);
    } catch (err) {
      setError('Failed to load transactions: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters, managerFilters, isManager]);
  
  // Load transactions on mount and when filters change
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);
  
  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle manager filter change
  const handleManagerFilterChange = (e) => {
    const { name, value } = e.target;
    setManagerFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle filter submit
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page when filters change
    loadTransactions();
  };
  
  // Handle pagination
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };
  
  // Helper function to format transaction type
  const formatTransactionType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  // Helper function to format monetary value
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Transaction History</h1>
      
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
      
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        
        <form onSubmit={handleFilterSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Transaction Type Filter */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type
              </label>
              <select
                id="type"
                name="type"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={filters.type}
                onChange={handleFilterChange}
              >
                <option value="">All Types</option>
                <option value="purchase">Purchase</option>
                <option value="redemption">Redemption</option>
                <option value="adjustment">Adjustment</option>
                <option value="transfer">Transfer</option>
                <option value="event">Event</option>
              </select>
            </div>
            
            {/* Points Amount Filter */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="operator" className="block text-sm font-medium text-gray-700 mb-1">
                  Points
                </label>
                <select
                  id="operator"
                  name="operator"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={filters.operator}
                  onChange={handleFilterChange}
                >
                  <option value="gte">≥</option>
                  <option value="lte">≤</option>
                </select>
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={filters.amount}
                  onChange={handleFilterChange}
                  placeholder="Enter points amount"
                />
              </div>
            </div>
            
            {/* Manager-specific filters */}
            {isManager && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    User
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={managerFilters.name}
                    onChange={handleManagerFilterChange}
                    placeholder="UTORID or name"
                  />
                </div>
                
                <div>
                  <label htmlFor="createdBy" className="block text-sm font-medium text-gray-700 mb-1">
                    Created By
                  </label>
                  <input
                    type="text"
                    id="createdBy"
                    name="createdBy"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={managerFilters.createdBy}
                    onChange={handleManagerFilterChange}
                    placeholder="UTORID of creator"
                  />
                </div>
                
                <div>
                  <label htmlFor="suspicious" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="suspicious"
                    name="suspicious"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={managerFilters.suspicious}
                    onChange={handleManagerFilterChange}
                  >
                    <option value="">All Statuses</option>
                    <option value="true">Suspicious</option>
                    <option value="false">Not Suspicious</option>
                  </select>
                </div>
              </>
            )}
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setFilters({
                  type: '',
                  promotionId: '',
                  amount: '',
                  operator: 'gte',
                });
                setManagerFilters({
                  name: '',
                  createdBy: '',
                  suspicious: '',
                });
                setPage(1);
              }}
              className="mr-3 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>
      
      {/* Transactions List */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Transactions</h2>
          <p className="text-gray-600 text-sm">
            Showing {transactions.length} of {totalCount} transactions
          </p>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="text-gray-600">Loading transactions...</div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-600">No transactions found matching your filters.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  {isManager && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                  )}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  {isManager && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  )}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.id}
                    </td>
                    {isManager && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.utorid}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${transaction.type === 'purchase' ? 'bg-green-100 text-green-800' :
                          transaction.type === 'redemption' ? 'bg-blue-100 text-blue-800' :
                          transaction.type === 'adjustment' ? 'bg-yellow-100 text-yellow-800' :
                          transaction.type === 'transfer' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'}`
                      }>
                        {formatTransactionType(transaction.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.type === 'purchase' && (
                        <span>
                          {formatCurrency(transaction.spent)}
                          {transaction.promotionIds && transaction.promotionIds.length > 0 && (
                            <span className="ml-2 text-xs text-green-600">
                              (+{transaction.promotionIds.length} promotions)
                            </span>
                          )}
                        </span>
                      )}
                      {transaction.type === 'redemption' && (
                        <span>
                          {formatCurrency(Math.abs(transaction.amount) * 0.01)}
                          {transaction.processedBy ? (
                            <span className="ml-2 text-xs text-green-600">Processed</span>
                          ) : (
                            <span className="ml-2 text-xs text-yellow-600">Pending</span>
                          )}
                        </span>
                      )}
                      {transaction.type === 'adjustment' && (
                        <span>
                          Related to Transaction #{transaction.relatedId}
                        </span>
                      )}
                      {transaction.type === 'transfer' && (
                        <span>
                          {transaction.amount > 0 ? 'From' : 'To'} User #{transaction.relatedId}
                        </span>
                      )}
                      {transaction.type === 'event' && (
                        <span>
                          Event #{transaction.relatedId}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {transaction.amount >= 0 ? '+' : ''}{transaction.amount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.createdBy}
                    </td>
                    {isManager && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.suspicious ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Suspicious
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Verified
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link
                        to={`/transactions/${transaction.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                      {isManager && transaction.type === 'purchase' && (
                        <button
                          onClick={() => navigate(`/transactions/${transaction.id}`)}
                          className="ml-3 text-yellow-600 hover:text-yellow-900"
                        >
                          Manage
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalCount > limit && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
                  page === 1 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page * limit >= totalCount}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
                  page * limit >= totalCount ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{Math.min((page - 1) * limit + 1, totalCount)}</span> to{' '}
                  <span className="font-medium">{Math.min(page * limit, totalCount)}</span> of{' '}
                  <span className="font-medium">{totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                      page === 1 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.ceil(totalCount / limit) }).map((_, index) => {
                    const pageNumber = index + 1;
                    const isActive = pageNumber === page;
                    
                    // Only show a limited number of page buttons
                    if (
                      pageNumber === 1 ||
                      pageNumber === Math.ceil(totalCount / limit) ||
                      (pageNumber >= page - 1 && pageNumber <= page + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            isActive
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (
                      (pageNumber === page - 2 && pageNumber > 1) ||
                      (pageNumber === page + 2 && pageNumber < Math.ceil(totalCount / limit))
                    ) {
                      return (
                        <span
                          key={pageNumber}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          ...
                        </span>
                      );
                    }
                    
                    return null;
                  })}
                  
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page * limit >= totalCount}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                      page * limit >= totalCount ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionListPage;