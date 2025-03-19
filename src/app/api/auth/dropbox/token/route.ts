import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/serverClient";

// Dropbox API configuration
const DROPBOX_TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";
const DROPBOX_APP_KEY = process.env.NEXT_PUBLIC_DROPBOX_APP_KEY || "";
const DROPBOX_APP_SECRET = process.env.DROPBOX_APP_SECRET || "";

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
      .single();

    if (authError && authError.code !== "PGRST116") {
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
    
    // Use the provided redirectUri or fallback to a default value
    // This ensures the same redirect URI is used in both the auth request and token exchange
    const finalRedirectUri = redirectUri || `${request.nextUrl.origin}/callback.html`;

    // Exchange the authorization code for tokens with PKCE
    const tokenResponse = await fetch(DROPBOX_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${DROPBOX_APP_KEY}:${DROPBOX_APP_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: finalRedirectUri,
        code_verifier: codeVerifier,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token exchange error:", tokenData);
      return NextResponse.json(
        { error: tokenData.error_description || "Token exchange failed" },
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
