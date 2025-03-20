"use client"

import { useState, useCallback, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase/clientSingleton";
import { useGlobal } from "@/lib/context/GlobalContext";
import { Database } from "@/lib/database.types";

// Base Dropbox URLs
const DROPBOX_AUTH_URL = "https://www.dropbox.com/oauth2/authorize";
const DROPBOX_TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";
const DROPBOX_API_URL = "https://api.dropboxapi.com/2";

// Add this to .env.local and .env.template when setting up Dropbox API integration
const DROPBOX_APP_KEY = process.env.NEXT_PUBLIC_DROPBOX_APP_KEY || process.env.NEXT_PUBLIC_DROPBOX_CLIENT_ID || "";
const DROPBOX_APP_SECRET = process.env.DROPBOX_APP_SECRET || "";
const DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN || "";

// Environment configuration with fallbacks
const DEV_HOST = process.env.NEXT_PUBLIC_DEV_HOST || 'localhost';
const DEV_PORT = process.env.NEXT_PUBLIC_DEV_PORT || '3000,3001,3002'; // Default fallback
const PROD_URL = process.env.NEXT_PUBLIC_URL || '';

// Determine the base URL based on environment
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Browser - use the current origin
    return window.location.origin;
  }
  
  // Server-side rendering
  if (process.env.NODE_ENV === 'production') {
    // Production - use the configured URL or a reasonable default
    return PROD_URL || 'https://app.rb3.io';
  } else {
    // Development - use host and port from env vars or defaults
    return `http://${DEV_HOST}:${DEV_PORT}`;
  }
};

// Set the redirect URI using the determined base URL
const REDIRECT_URI = typeof window !== 'undefined' 
  ? `${window.location.origin}/callback.html`
  : `${getBaseUrl()}/callback.html`;

type DropboxToken = {
  access_token: string;
  refresh_token: string;
  account_id: string;
  expires_at: Date;
};

// Helper function to generate a random string for PKCE
// Must be between 43-128 characters as per OAuth PKCE spec
function generateRandomString(length: number): string {
  // Use only characters allowed in the PKCE spec
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  
  // Ensure length is within the required range (43-128)
  const finalLength = Math.max(43, Math.min(length, 128));
  
  let text = '';
  // Use crypto API for better randomness if available
  if (typeof window !== 'undefined' && window.crypto) {
    const randomValues = new Uint8Array(finalLength);
    window.crypto.getRandomValues(randomValues);
    for (let i = 0; i < finalLength; i++) {
      text += possible.charAt(randomValues[i] % possible.length);
    }
  } else {
    // Fallback to Math.random if crypto API is not available
    for (let i = 0; i < finalLength; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
  }
  return text;
}

// Helper function to create a SHA-256 hash
async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(hash);
}

// Helper function to base64url encode
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(bytes)));
  // Replace characters according to base64url specifications (RFC 4648)
  return base64
    .replace(/\+/g, '-')  // '+' → '-'
    .replace(/\//g, '_')  // '/' → '_'
    .replace(/=+$/, '');  // Remove trailing '='
}

export function useDropboxAuth() {
  const supabase = getSupabaseClient();
  const { user: globalUser } = useGlobal();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tokens, setTokens] = useState<DropboxToken | null>(null);

  // Generate the authorization URL for Dropbox OAuth flow with PKCE
  const getAuthUrl = useCallback(async () => {
    if (!DROPBOX_APP_KEY) {
      setError(new Error("Dropbox API key not configured"));
      return null;
    }

    try {
      // Generate CSRF token
      const csrf = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem("dropbox_csrf", csrf);
      
      // Generate PKCE code verifier and challenge
      const codeVerifier = generateRandomString(128);
      sessionStorage.setItem("dropbox_code_verifier", codeVerifier);
      const codeChallenge = await sha256(codeVerifier);
      
      // Build authorization URL
      const authUrl = new URL(DROPBOX_AUTH_URL);
      authUrl.searchParams.append("client_id", DROPBOX_APP_KEY);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
      authUrl.searchParams.append("state", csrf);
      authUrl.searchParams.append("token_access_type", "offline");
      authUrl.searchParams.append("code_challenge", codeChallenge);
      authUrl.searchParams.append("code_challenge_method", "S256");
      
      // Force re-consent to ensure we get a fresh code
      authUrl.searchParams.append("force_reapprove", "true");

      return authUrl.toString();
    } catch (err) {
      console.error("Error generating auth URL:", err);
      setError(err instanceof Error ? err : new Error("Failed to generate auth URL"));
      return null;
    }
  }, []);

  // Refresh the Dropbox token
  const refreshToken = useCallback(
    async (refreshTokenStr: string) => {
      try {
        // Determine the API endpoint URL based on the current origin
        const apiBaseUrl = typeof window !== 'undefined' 
          ? window.location.origin 
          : getBaseUrl();
        
        const refreshEndpoint = `${apiBaseUrl}/api/auth/dropbox/refresh`;
        
        console.log("Using refresh endpoint:", refreshEndpoint);
        
        // This would normally be implemented on the server side
        // to avoid exposing the app secret to the client
        const response = await fetch(refreshEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken: refreshTokenStr }),
        });

        if (!response.ok) {
          throw new Error("Failed to refresh token");
        }

        const data = await response.json();
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

        // Update the database with new tokens
        await supabase.from("dropbox_auth").upsert(
          {
            user_id: globalUser?.id,
            access_token: data.access_token,
            refresh_token: data.refresh_token || refreshTokenStr, // Some OAuth providers don't return a new refresh token
            account_id: data.account_id,
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id'
          }
        );

        setTokens({
          access_token: data.access_token,
          refresh_token: data.refresh_token || refreshTokenStr,
          account_id: data.account_id,
          expires_at: expiresAt,
        });

        setIsAuthenticated(true);
      } catch (err) {
        console.error("Error refreshing token:", err);
        setError(err instanceof Error ? err : new Error("Failed to refresh token"));
        setIsAuthenticated(false);
      }
    },
    [supabase, globalUser]
  );

  // Check if the user is already authenticated with Dropbox
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First check if Dropbox credentials are configured
      if (!DROPBOX_APP_KEY) {
        console.warn("Dropbox API client ID not configured in environment variables");
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      if (!DROPBOX_APP_SECRET) {
        console.warn("Dropbox API secret not configured in environment variables");
        // Continue anyway as the secret is only needed for server-side operations
      }

      // Use the user from global context
      if (!globalUser) {
        console.warn("User not authenticated");
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      // Check if we're in development mode and have a mock token
      if (process.env.NODE_ENV === "development" && DROPBOX_ACCESS_TOKEN) {
        console.log("Using development mode Dropbox token");
        const mockExpiresAt = new Date();
        mockExpiresAt.setFullYear(mockExpiresAt.getFullYear() + 1); // Set expiry to 1 year from now
        
        setTokens({
          access_token: DROPBOX_ACCESS_TOKEN,
          refresh_token: "mock-refresh-token",
          account_id: "mock-account-id",
          expires_at: mockExpiresAt,
        });
        
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }
      
      const { data: authData, error: authError } = await supabase
        .from("dropbox_auth")
        .select("*")
        .eq("user_id", globalUser.id)
        .maybeSingle();

      if (authError) {
        // PGRST116 is "row not found" error, which is expected if not authenticated
        if (authError.code === "PGRST116") {
          console.log("No Dropbox authentication found for user");
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        throw authError;
      }

      if (authData) {
        // Check if tokens are expired
        const expiresAt = new Date(authData.expires_at || "");
        const now = new Date();

        if (expiresAt > now) {
          // Tokens are still valid
          console.log("Dropbox tokens are valid");
          setIsAuthenticated(true);
          setTokens({
            access_token: authData.access_token || "",
            refresh_token: authData.refresh_token || "",
            account_id: authData.account_id || "",
            expires_at: expiresAt,
          });
        } else {
          // Tokens expired, need to refresh
          console.log("Dropbox tokens expired, attempting to refresh");
          if (authData.refresh_token) {
            await refreshToken(authData.refresh_token);
          } else {
            setIsAuthenticated(false);
          }
        }
      } else {
        console.log("No Dropbox authentication data found");
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("Error checking Dropbox auth:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Failed to check Dropbox authentication";
      setError(new Error(`Error checking Dropbox auth: ${errorMessage}`));
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, refreshToken, globalUser]);

  // Handle the OAuth callback
  const handleCallback = useCallback(
    async (code: string, state: string) => {
      const storedState = sessionStorage.getItem("dropbox_csrf");
      if (state !== storedState) {
        setError(new Error("CSRF state mismatch"));
        return;
      }

      // Get the code verifier that was stored when generating the auth URL
      const codeVerifier = sessionStorage.getItem("dropbox_code_verifier");
      if (!codeVerifier) {
        setError(new Error("Code verifier not found"));
        return;
      }

      try {
        // Validate code verifier format (must be 43-128 characters)
        if (!codeVerifier || codeVerifier.length < 43 || codeVerifier.length > 128) {
          console.error("Invalid code verifier format:", { 
            length: codeVerifier?.length,
            required: "43-128 characters"
          });
          throw new Error("Invalid code verifier format");
        }
        
        console.log("Starting token exchange with:", {
          codeVerifierLength: codeVerifier.length,
          redirectUri: REDIRECT_URI,
          state: state ? "present" : "missing",
          code: code ? "present" : "missing",
          appKeyPresent: !!DROPBOX_APP_KEY,
        });
        
        // Determine the API endpoint URL based on the current origin
        const apiBaseUrl = typeof window !== 'undefined' 
          ? window.location.origin 
          : getBaseUrl();
        
        const tokenEndpoint = `${apiBaseUrl}/api/auth/dropbox/token`;
        
        console.log("Using token endpoint:", tokenEndpoint);
        
        // Prepare the request to our backend token endpoint
        const response = await fetch(tokenEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            code,
            codeVerifier,
            redirectUri: REDIRECT_URI
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Token exchange failed:", {
            status: response.status,
            statusText: response.statusText,
            errorData,
            code,
            codeVerifier,
            redirectUri: REDIRECT_URI,
            appKeyPresent: !!DROPBOX_APP_KEY,
          });
          throw new Error(`Failed to exchange code for token: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

        // Store tokens in database
        await supabase.from("dropbox_auth").upsert(
          {
            user_id: globalUser?.id,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            account_id: data.account_id,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id'
          }
        );

        setTokens({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          account_id: data.account_id,
          expires_at: expiresAt,
        });

        setIsAuthenticated(true);
      } catch (err) {
        console.error("Error handling callback:", err);
        setError(err instanceof Error ? err : new Error("Failed to handle Dropbox callback"));
      }
    },
    [supabase, globalUser]
  );

  // Disconnect from Dropbox
  const disconnect = useCallback(async () => {
    try {
      // Revoke the token with Dropbox API
      if (tokens?.access_token) {
        // Determine the API endpoint URL based on the current origin
        const apiBaseUrl = typeof window !== 'undefined' 
          ? window.location.origin 
          : getBaseUrl();
        
        const revokeEndpoint = `${apiBaseUrl}/api/auth/dropbox/revoke`;
        
        console.log("Using revoke endpoint:", revokeEndpoint);
        
        await fetch(revokeEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: tokens.access_token }),
        });
      }

      // Remove from database
      await supabase
        .from("dropbox_auth")
        .delete()
        .eq("user_id", globalUser?.id);

      setTokens(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error("Error disconnecting from Dropbox:", err);
      setError(err instanceof Error ? err : new Error("Failed to disconnect from Dropbox"));
    }
  }, [supabase, tokens, globalUser]);

  // Implementation of Dropbox file listing
  const listFiles = useCallback(async (path: string = "") => {
    // Removed mock implementation to use real Dropbox API

    // Check if authenticated
    if (!isAuthenticated || !tokens?.access_token) {
      throw new Error("Not authenticated with Dropbox");
    }

    try {
      const response = await fetch(`${DROPBOX_API_URL}/files/list_folder`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: path || "",
          recursive: false,
          include_media_info: false,
          include_deleted: false,
          include_has_explicit_shared_members: false,
        }),
      });

      if (!response.ok) {
        // Check if token expired
        if (response.status === 401) {
          // Refresh token and retry
          if (tokens.refresh_token) {
            await refreshToken(tokens.refresh_token);
            return listFiles(path);
          }
        }
        throw new Error(`Failed to list files: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error("Error listing Dropbox files:", err);
      throw err;
    }
  }, [isAuthenticated, tokens, refreshToken]);

  // Check authentication status on mount
  useEffect(() => {
    // Add a mounting flag to prevent infinite loops
    let isMounted = true;
    
    const runAuthCheck = async () => {
      if (isMounted) {
        setIsLoading(true);
        try {
          await checkAuth();
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }
    };
    
    runAuthCheck();
    
    return () => {
      isMounted = false;
    };
  }, [checkAuth]);

  // Upload a file to Dropbox
  const uploadFile = useCallback(async (file: File, path: string = "") => {
    // Check if authenticated
    if (!isAuthenticated || !tokens?.access_token) {
      throw new Error("Not authenticated with Dropbox");
    }

    try {
      // Convert file to ArrayBuffer
      const fileBuffer = await file.arrayBuffer();
      
      // Construct the path where the file will be saved
      const dropboxPath = path ? `${path}/${file.name}` : `/${file.name}`;
      
      // Upload the file to Dropbox
      const response = await fetch(`${DROPBOX_API_URL}/files/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Content-Type": "application/octet-stream",
          "Dropbox-API-Arg": JSON.stringify({
            path: dropboxPath,
            mode: "overwrite",
            autorename: true,
            mute: false,
          }),
        },
        body: fileBuffer,
      });

      if (!response.ok) {
        // Check if token expired
        if (response.status === 401) {
          // Refresh token and retry
          if (tokens.refresh_token) {
            await refreshToken(tokens.refresh_token);
            return uploadFile(file, path);
          }
        }
        throw new Error(`Failed to upload file: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error("Error uploading file to Dropbox:", err);
      throw err;
    }
  }, [isAuthenticated, tokens, refreshToken]);

  // Create a folder in Dropbox
  const createFolder = useCallback(async (folderName: string, path: string = "") => {
    // Check if authenticated
    if (!isAuthenticated || !tokens?.access_token) {
      throw new Error("Not authenticated with Dropbox");
    }

    try {
      // Construct the path where the folder will be created
      const dropboxPath = path ? `${path}/${folderName}` : `/${folderName}`;
      
      // Create the folder in Dropbox
      const response = await fetch(`${DROPBOX_API_URL}/files/create_folder_v2`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: dropboxPath,
          autorename: true,
        }),
      });

      if (!response.ok) {
        // Check if token expired
        if (response.status === 401) {
          // Refresh token and retry
          if (tokens.refresh_token) {
            await refreshToken(tokens.refresh_token);
            return createFolder(folderName, path);
          }
        }
        throw new Error(`Failed to create folder: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error("Error creating folder in Dropbox:", err);
      throw err;
    }
  }, [isAuthenticated, tokens, refreshToken]);

  return {
    isAuthenticated,
    isLoading,
    error,
    getAuthUrl,
    handleCallback,
    disconnect,
    listFiles,
    uploadFile,
    createFolder,
  };
}
