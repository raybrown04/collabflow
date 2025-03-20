import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/serverClient";

// Handle the OAuth callback from Dropbox
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  console.log("Dropbox OAuth callback received:", {
    hasCode: !!code,
    hasState: !!state,
    error: error || "none",
    errorDescription: errorDescription || "none",
    url: request.url
  });

  // Handle errors from Dropbox
  if (error) {
    console.error("Dropbox auth error:", error, errorDescription);
    
    // Create a URL with all error information
    const redirectUrl = new URL("/app/documents", request.url);
    redirectUrl.searchParams.append("error", error);
    if (errorDescription) {
      redirectUrl.searchParams.append("error_description", errorDescription);
    }
    redirectUrl.searchParams.append("auth_source", "dropbox");
    redirectUrl.searchParams.append("timestamp", new Date().toISOString());
    
    return NextResponse.redirect(redirectUrl);
  }

  // Validate required parameters
  if (!code || !state) {
    console.error("Missing required parameters for Dropbox OAuth callback");
    
    const missingParams = [];
    if (!code) missingParams.push("code");
    if (!state) missingParams.push("state");
    
    const redirectUrl = new URL("/app/documents", request.url);
    redirectUrl.searchParams.append("error", "missing_params");
    redirectUrl.searchParams.append("missing", missingParams.join(","));
    redirectUrl.searchParams.append("auth_source", "dropbox");
    
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to the callback.html page with the code and state as query parameters
  // This ensures we're using the same domain for the callback as was used for the auth request
  const callbackUrl = new URL("/callback.html", request.url);
  callbackUrl.searchParams.append("code", code);
  callbackUrl.searchParams.append("state", state);
  callbackUrl.searchParams.append("source", "api_callback");
  
  console.log("Redirecting to callback handler:", callbackUrl.toString());
  
  return NextResponse.redirect(callbackUrl);
}
