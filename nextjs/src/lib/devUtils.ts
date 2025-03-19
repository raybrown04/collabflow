'use client';

/**
 * Development utilities for the CollabFlow application.
 * These utilities are only available in development mode.
 */

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Enable or disable mock authentication in development mode.
 * This allows bypassing the authentication flow for testing purposes.
 * 
 * @param enable Whether to enable or disable mock authentication
 * @returns True if the operation was successful, false otherwise
 */
export function enableMockAuth(enable = true): boolean {
  if (!isDevelopment) {
    console.warn('Mock authentication is only available in development mode');
    return false;
  }

  try {
    localStorage.setItem('mockLoggedIn', enable ? 'true' : 'false');
    console.log(`Mock authentication ${enable ? 'enabled' : 'disabled'}`);
    console.log('Reload the page to apply changes');
    return true;
  } catch (error) {
    console.error('Failed to set mock authentication:', error);
    return false;
  }
}

/**
 * Check if mock authentication is enabled.
 * 
 * @returns True if mock authentication is enabled, false otherwise
 */
export function isMockAuthEnabled(): boolean {
  if (!isDevelopment) return false;
  
  try {
    return localStorage.getItem('mockLoggedIn') === 'true';
  } catch (error) {
    return false;
  }
}

/**
 * Add development utilities to the window object for easy access in the browser console.
 * This function is automatically called when this module is imported.
 */
function setupDevUtils(): void {
  if (isDevelopment && typeof window !== 'undefined') {
    // Add utilities to window object for easy access in browser console
    (window as any).devUtils = {
      enableMockAuth,
      isMockAuthEnabled,
      isDevelopment,
    };
    
    console.log('Development utilities available at window.devUtils');
    console.log('Example: window.devUtils.enableMockAuth() to bypass authentication');
  }
}

// Auto-setup when imported
if (isDevelopment && typeof window !== 'undefined') {
  setupDevUtils();
}
