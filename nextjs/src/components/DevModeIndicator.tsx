'use client';

import { useEffect, useState } from 'react';
import { isMockAuthEnabled } from '@/lib/devUtils';

/**
 * A component that displays a development mode indicator when the app is running
 * in development mode with mock authentication enabled.
 */
export function DevModeIndicator() {
  const [showIndicator, setShowIndicator] = useState(false);
  
  useEffect(() => {
    // Only show in development mode with mock auth enabled
    const isDevelopment = process.env.NODE_ENV === 'development';
    const mockAuthEnabled = isMockAuthEnabled();
    
    setShowIndicator(isDevelopment && mockAuthEnabled);
  }, []);
  
  if (!showIndicator) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-yellow-500 text-black px-3 py-2 rounded-md shadow-lg z-50 text-sm font-medium flex items-center space-x-2">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
      <span>DEV MODE - Auth Bypassed</span>
      <button 
        onClick={() => {
          localStorage.setItem('mockLoggedIn', 'false');
          window.location.reload();
        }}
        className="ml-2 bg-black text-white px-2 py-1 rounded text-xs"
      >
        Disable
      </button>
    </div>
  );
}
