import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/serverClient";

// Dropbox API configuration
const DROPBOX_TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";
const DROPBOX_APP_KEY = process.env.NEXT_PUBLIC_DROPBOX_APP_KEY || process.env.NEXT_PUBLIC_DROPBOX_CLIENT_ID || "";
const DROPBOX_APP_SECRET = process.env.DROPBOX_APP_SECRET || "";

// Log environment variables for debugging (without exposing secrets)
console.log("Dropbox API Configuration:", {
  hasAppKey: !!DROPBOX_APP_KEY,
  hasAppSecret: !!DROPBOX_APP_SECRET,
  tokenUrl: DROPBOX_TOKEN_URL
});

export async function GET() {
  try {
    // Validate API keys
    if (!DROPBOX_APP_KEY || !DROPBOX_APP_SECRET) {
      return NextResponse.json(
        { error: "Dropbox API credentials not configured" },
        { status: 500 }
      );
    }

    // Get the current user from Supabase
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Check if the user has Dropbox tokens
    const { data: authData, error: authError } = await supabase
      .from("dropbox_auth")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (authError) {
      console.error("Error fetching Dropbox auth:", authError);
      return NextResponse.json(
        { error: "Failed to fetch Dropbox authentication" },
        { status: 500 }
      );
    }

    if (!authData) {
      return NextResponse.json(
        { authenticated: false }
      );
    }

    // Check if tokens are expired
    const expiresAt = new Date(authData.expires_at || "");
    const now = new Date();

    if (expiresAt <= now) {
      // Tokens expired, need to refresh
      // In a real implementation, you would refresh the token here
      return NextResponse.json(
        { authenticated: false, needsRefresh: true }
      );
    }

    // Return the access token (but not the refresh token for security)
    return NextResponse.json({
      authenticated: true,
      accessToken: authData.access_token,
      accountId: authData.account_id,
      expiresAt: authData.expires_at
    });
  } catch (error) {
    console.error("Error checking Dropbox token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate API keys
    if (!DROPBOX_APP_KEY || !DROPBOX_APP_SECRET) {
      console.error("Dropbox API credentials not configured");
      return NextResponse.json(
        { error: "Dropbox API credentials not configured" },
        { status: 500 }
      );
    }

    // Read request body only once
    const requestBody = await request.json();
    const { code, codeVerifier, redirectUri = "" } = requestBody;

    console.log("Token exchange request received:", {
      hasCode: !!code,
      codeVerifierLength: codeVerifier?.length,
      providedRedirectUri: redirectUri || "none",
      requestOrigin: request.headers.get('origin') || 'unknown'
    });

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code is required" },
        { status: 400 }
      );
    }

    if (!codeVerifier) {
      return NextResponse.json(
        { error: "Code verifier is required for PKCE" },
        { status: 400 }
      );
    }
    
    // Environment configuration with fallbacks for server-side
    const DEV_HOST = process.env.NEXT_PUBLIC_DEV_HOST || 'localhost';
    const DEV_PORT = process.env.NEXT_PUBLIC_DEV_PORT || '3000';
    const PROD_URL = process.env.NEXT_PUBLIC_URL || '';
    
    // Determine the base URL if redirectUri is not provided
    const getBaseUrl = () => {
      // Use request origin if available
      const origin = request.headers.get('origin');
      if (origin && origin !== 'null') {
        return origin;
      }
      
      // Use request URL origin as fallback
      if (request.nextUrl?.origin && request.nextUrl.origin !== 'null') {
        return request.nextUrl.origin;
      }
      
      // Otherwise use environment-based fallback
      if (process.env.NODE_ENV === 'production') {
        return PROD_URL || 'https://app.rb3.io';
      } else {
        return `http://${DEV_HOST}:${DEV_PORT}`;
      }
    };
    
    // Use the provided redirectUri or fallback to a dynamically determined one
    const finalRedirectUri = redirectUri || `${getBaseUrl()}/callback.html`;
    
    console.log("Using redirect URI:", finalRedirectUri);

    // Log the request parameters for debugging
    console.log("Token exchange request parameters:", {
      grant_type: "authorization_code",
      code: code ? "present" : "missing",
      redirect_uri: finalRedirectUri,
      code_verifier_length: codeVerifier?.length,
      client_id: DROPBOX_APP_KEY ? "present" : "missing"
    });

    // Prepare the form data for the token request
    const formData = new URLSearchParams();
    formData.append("grant_type", "authorization_code");
    formData.append("code", code);
    formData.append("redirect_uri", finalRedirectUri);
    formData.append("code_verifier", codeVerifier);
    formData.append("client_id", DROPBOX_APP_KEY);
    formData.append("client_secret", DROPBOX_APP_SECRET);

    // Exchange the authorization code for tokens with PKCE
    const tokenResponse = await fetch(DROPBOX_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        // For public clients using PKCE, we should NOT include the Authorization header
        // as it's not needed and can cause issues
      },
      body: formData,
    });

    // Try to parse the response as JSON, but handle non-JSON responses gracefully
    let tokenData;
    const responseText = await tokenResponse.text();
    try {
      tokenData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse token response as JSON:", responseText);
      tokenData = { error: "invalid_response", error_description: "Invalid response from Dropbox API" };
    }

    if (!tokenResponse.ok) {
      console.error("Token exchange error details:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: tokenData,
        requestParams: {
          redirect_uri: finalRedirectUri,
          code_verifier_length: codeVerifier.length,
          client_id: DROPBOX_APP_KEY ? "present" : "missing",
          // Don't log the actual code or verifier for security
        },
        headers: Object.fromEntries(tokenResponse.headers.entries())
      });
      
      return NextResponse.json(
        { 
          error: tokenData.error_description || "Token exchange failed",
          details: {
            error_type: tokenData.error || "unknown",
            status: tokenResponse.status,
            raw_response: process.env.NODE_ENV === 'development' ? responseText : undefined
          }
        },
        { status: tokenResponse.status }
      );
    }

    // Get the current user from Supabase
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Calculate token expiration time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    // Store the tokens in the database
    const { error } = await supabase.from("dropbox_auth").upsert(
      {
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        account_id: tokenData.account_id,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id'
      }
    );

    if (error) {
      console.error("Error storing tokens:", error);
      return NextResponse.json(
        { error: "Failed to store tokens" },
        { status: 500 }
      );
    }

    // Return the tokens to the client
    return NextResponse.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      account_id: tokenData.account_id,
      expires_in: tokenData.expires_in,
    });
  } catch (error) {
    console.error("Token exchange error:", error);
    
    // Provide more detailed error information
    let errorMessage = "Internal server error";
    let errorDetails = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
