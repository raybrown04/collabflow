'use client';

import { createBrowserClient } from '@supabase/ssr';
import { type Database } from '@/lib/database.types';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Create a singleton instance of the Supabase client
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

// Monkey patch the global JSON.parse to handle base64 encoded strings
// This is a workaround for the Supabase cookie parsing issue
const originalJSONParse = JSON.parse;
JSON.parse = function(text: string, ...rest: any[]) {
  try {
    // First try the original parse
    return originalJSONParse(text, ...rest);
  } catch (e) {
    // If it fails and starts with base64-, try to decode it first
    if (typeof text === 'string' && text.startsWith('base64-')) {
      try {
        const base64Value = text.replace('base64-', '');
        const decodedValue = atob(base64Value);
        return originalJSONParse(decodedValue, ...rest);
      } catch (innerError) {
        console.warn('Failed to decode base64 string:', innerError);
      }
    }
    
    // If all else fails, rethrow the original error
    throw e;
  }
};

export function getSupabaseClient() {
  if (!supabaseClient) {
    try {
      // Create client with default options
      supabaseClient = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          // Browser client uses cookies automatically, but we need to specify the auth flow
          auth: {
            flowType: 'pkce',
            detectSessionInUrl: true,
            autoRefreshToken: true
          }
        }
      );
      
      if (typeof window !== 'undefined') {
        console.log('Supabase client initialized successfully');
        
        // In development mode, enable a way to bypass authentication
        if (isDevelopment) {
          // Add a global function to toggle mock authentication
          (window as any).toggleMockAuth = (loggedIn = true) => {
            localStorage.setItem('mockLoggedIn', loggedIn ? 'true' : 'false');
            console.log(`Mock auth set to: ${loggedIn ? 'logged in' : 'logged out'}`);
            // Reload to apply changes
            window.location.reload();
          };
          
          console.log('Development mode: Auth bypass available. Use window.toggleMockAuth() to toggle.');
          console.log('Example: window.toggleMockAuth(true) to mock logged in state');
        }
      }
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
      // Retry client creation with minimal options
      supabaseClient = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
  }
  
  // This should never be null at this point
  if (!supabaseClient) {
    throw new Error('Failed to initialize Supabase client');
  }
  
  return supabaseClient;
}

// Add session event listeners
export function initializeSupabaseClient() {
  const client = getSupabaseClient();
  
  // Set up auth state change listener
  const { data: { subscription } } = client.auth.onAuthStateChange(
    (event, session) => {
      // Handle auth state changes (sign in, sign out, etc.)
      if (event === 'SIGNED_OUT') {
        // Clear any cached data when user signs out
        supabaseClient = null; // Force re-creation of client
      }
    }
  );
  
  // Return cleanup function
  return () => {
    subscription.unsubscribe();
  };
}
