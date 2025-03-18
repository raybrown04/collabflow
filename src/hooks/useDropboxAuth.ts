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
// Use http://localhost/callback.html as the redirect URI
// This static HTML page will handle the redirect to our app
// Important: We use just 'localhost' without a port number for Dropbox OAuth
// The callback.html page will handle redirecting back to the correct port
const REDIRECT_URI = "http://localhost/callback.html";

type DropboxToken = {
  access_token: string;
  refresh_token: string;
  account_id: string;
  expires_at: Date;
};

// Helper function to generate a random string for PKCE
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
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
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
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
        // This would normally be implemented on the server side
        // to avoid exposing the app secret to the client
        const response = await fetch("/api/auth/dropbox/refresh", {
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
        .single();

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
        // This would normally be implemented on the server side
        // to avoid exposing the app secret to the client
        const response = await fetch("/api/auth/dropbox/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            code,
            codeVerifier
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to exchange code for token");
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
        await fetch("/api/auth/dropbox/revoke", {
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
    checkAuth();
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
