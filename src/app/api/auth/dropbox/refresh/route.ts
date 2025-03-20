import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/serverClient";

// Dropbox API configuration
const DROPBOX_TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";
const DROPBOX_APP_KEY = process.env.NEXT_PUBLIC_DROPBOX_APP_KEY || "";
const DROPBOX_APP_SECRET = process.env.DROPBOX_APP_SECRET || "";

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

    // Get the refresh token from the request
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 }
      );
    }

    console.log("Token refresh request received:", {
      hasRefreshToken: !!refreshToken,
      refreshTokenLength: refreshToken?.length,
      requestOrigin: request.headers.get('origin') || 'unknown'
    });

    // Exchange the refresh token for a new access token
    const tokenResponse = await fetch(DROPBOX_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${DROPBOX_APP_KEY}:${DROPBOX_APP_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    // Try to parse the response as JSON, but handle non-JSON responses gracefully
    let tokenData;
    const responseText = await tokenResponse.text();
    try {
      tokenData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse token refresh response as JSON:", responseText);
      tokenData = { error: "invalid_response", error_description: "Invalid response from Dropbox API" };
    }

    if (!tokenResponse.ok) {
      console.error("Token refresh error details:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: tokenData,
        headers: Object.fromEntries(tokenResponse.headers.entries())
      });
      
      // If the refresh token is invalid or expired, we need to re-authenticate
      if (tokenResponse.status === 400 && 
          (tokenData.error === "invalid_grant" || tokenData.error === "expired_token")) {
        return NextResponse.json(
          { 
            error: "Refresh token expired or invalid",
            details: {
              error_type: tokenData.error,
              requires_reauth: true
            }
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { 
          error: tokenData.error_description || "Token refresh failed",
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

    // Store the new tokens in the database
    const { error } = await supabase.from("dropbox_auth").upsert(
      {
        user_id: user.id,
        access_token: tokenData.access_token,
        // Some providers don't return a new refresh token with every refresh
        refresh_token: tokenData.refresh_token || refreshToken,
        account_id: tokenData.account_id,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id'
      }
    );

    if (error) {
      console.error("Error storing refreshed tokens:", error);
      return NextResponse.json(
        { error: "Failed to store refreshed tokens" },
        { status: 500 }
      );
    }

    console.log("Token refresh successful, new token expires at:", expiresAt.toISOString());

    // Return the new tokens to the client
    return NextResponse.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || refreshToken,
      account_id: tokenData.account_id,
      expires_in: tokenData.expires_in,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    
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
