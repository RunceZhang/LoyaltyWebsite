// components/qrcode/QRCodeComponents.js
import React from 'react';
import QRCode from 'qrcode.react';
import { useAuth } from '../../contexts/AuthContext';

// QR code component for user identification
const UserQRCode = ({ size = 200 }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <div>Loading user information...</div>;
  }
  
  // Create a data object that will be encoded in the QR code
  const qrData = JSON.stringify({
    type: 'user',
    id: currentUser.id,
    utorid: currentUser.utorid,
    name: currentUser.name
  });
  
  return (
    <div className="flex flex-col items-center">
      <div className="border-4 border-blue-500 rounded-lg p-2 bg-white">
        <QRCode 
          value={qrData}
          size={size} 
          level="H" // High error correction capability
          includeMargin={true}
        />
      </div>
      <p className="mt-2 text-center text-sm text-gray-600">
        Scan this code to identify yourself to a cashier for purchases or transfers
      </p>
    </div>
  );
};

// QR code component for redemption requests
const RedemptionQRCode = ({ transaction, size = 200 }) => {
  if (!transaction) {
  return <div>No transaction data available</div>;
  }
  
  // Create a data object that will be encoded in the QR code
  const qrData = JSON.stringify({
    type: 'redemption',
    id: transaction.id,
    amount: transaction.amount,
    utorid: transaction.utorid || transaction.createdBy
  });
  
  return (
    <div className="flex flex-col items-center">
      <div className="border-4 border-green-500 rounded-lg p-2 bg-white">
        <QRCode 
          value={qrData}
          size={size} 
          level="H" // High error correction capability
          includeMargin={true}
        />
      </div>
      <p className="mt-2 text-center text-sm text-gray-600">
        Show this QR code to a cashier to process your redemption of {Math.abs(transaction.amount)} points
      </p>
    </div>
  );
};

// Simplified placeholder for QR Scanner component
const QRScanner = () => {
  return (
    <div className="flex flex-col items-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
      <div className="text-center mb-4">
        <h3 className="font-medium text-gray-700">QR Code Scanner</h3>
        <p className="text-sm text-gray-500">
          QR code scanning is not available in this version.
          <br />
          Please use the manual entry form below.
        </p>
      </div>
      
      <div className="flex items-center text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1v-2a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      </div>
    </div>
  );
};

export { UserQRCode, RedemptionQRCode, QRScanner };