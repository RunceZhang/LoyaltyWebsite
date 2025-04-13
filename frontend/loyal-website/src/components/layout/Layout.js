// components/layout/Layout.js
import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Layout = () => {
  const { currentUser, logout, isManager, isCashier, isSuperuser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold">Points System</Link>
          </div>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden flex items-center p-2"
            onClick={toggleMobileMenu}
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:text-blue-200">Dashboard</Link>
            <Link to="/transactions/history" className="hover:text-blue-200">Transactions</Link>
            <Link to="/events" className="hover:text-blue-200">Events</Link>
            <Link to="/promotions" className="hover:text-blue-200">Promotions</Link>
            
            {/* Cashier specific links */}
            {isCashier && (
              <>
                <Link to="/register" className="hover:text-blue-200">Register User</Link>
                <Link to="/transactions" className="hover:text-blue-200">Process Transactions</Link>
              </>
            )}
            
            {/* Manager specific links */}
            {isManager && (
              <>
                <Link 
                  to="/events/organizer" 
                  className={`hover:text-blue-200 ${
                    location.pathname.startsWith('/events/organizer') || 
                    location.pathname.startsWith('/events/manage') ||
                    location.pathname.startsWith('/events/guests') ||
                    location.pathname.startsWith('/events/award') ||
                    location.pathname.startsWith('/events/organizers') ||
                    location.pathname.startsWith('/events/create')
                      ? 'font-semibold text-blue-200'
                      : ''
                  }`}
                >
                  Manage Events
                </Link>
                <Link to="/admin/users" className="hover:text-blue-200">User Management</Link>
              </>
            )}
            
            <div className="relative">
              <button 
                className="flex items-center hover:text-blue-200"
                onClick={toggleDropdown}
              >
                <span>{currentUser?.name}</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 bg-white text-gray-800 shadow-lg rounded-md py-2 mt-1 w-48 z-10">
                  <Link 
                    to="/profile" 
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsDropdownOpen(false);
                    }} 
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
        
        {/* Mobile navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden bg-blue-700 py-3">
            <div className="container mx-auto px-4 flex flex-col space-y-3">
              <Link to="/" className="hover:text-blue-200" onClick={toggleMobileMenu}>Dashboard</Link>
              <Link to="/transactions/history" className="hover:text-blue-200" onClick={toggleMobileMenu}>Transactions</Link>
              <Link to="/events" className="hover:text-blue-200" onClick={toggleMobileMenu}>Events</Link>
              <Link to="/promotions" className="hover:text-blue-200" onClick={toggleMobileMenu}>Promotions</Link>
              
              {/* Cashier specific links */}
              {isCashier && (
                <>
                  <Link to="/register" className="hover:text-blue-200" onClick={toggleMobileMenu}>Register User</Link>
                  <Link to="/transactions" className="hover:text-blue-200" onClick={toggleMobileMenu}>Process Transactions</Link>
                </>
              )}
              
              {/* Manager specific links */}
              {isManager && (
                <>
                  <Link to="/events/organizer" className="hover:text-blue-200" onClick={toggleMobileMenu}>Manage Events</Link>
                </>
              )}
              
              {/* Superuser specific links */}
              {isSuperuser && (
                <Link to="/admin/users" className="hover:text-blue-200" onClick={toggleMobileMenu}>User Management</Link>
              )}
              
              <div className="border-t border-blue-600 pt-2">
                <Link to="/profile" className="block hover:text-blue-200" onClick={toggleMobileMenu}>Profile</Link>
                <button 
                  onClick={() => {
                    handleLogout();
                    toggleMobileMenu();
                  }} 
                  className="block w-full text-left hover:text-blue-200 mt-2"
                >
                  Logout
                </button>
              </div>
            </div>
          </nav>
        )}
      </header>
      
      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-100 py-4 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© {new Date().getFullYear()} Points System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;