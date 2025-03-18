import { NextRequest, NextResponse } from "next/server";

/**
 * Root-level callback handler for Dropbox OAuth
 * 
 * This handler receives the initial callback from Dropbox at http://localhost
 * and redirects to our internal app handler with all parameters preserved.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  
  // Get the current origin with port
  const currentOrigin = request.headers.get("host") 
    ? `${request.nextUrl.protocol}//${request.headers.get("host")}` 
    : "";
  
  // Build the redirect URL to our internal handler
  const redirectUrl = new URL(
    `/app/documents`,
    currentOrigin
  );
  
  // Preserve all query parameters
  if (code) redirectUrl.searchParams.append("code", code);
  if (state) redirectUrl.searchParams.append("state", state);
  if (error) redirectUrl.searchParams.append("error", error);
  
  console.log(`Redirecting Dropbox OAuth callback to: ${redirectUrl.toString()}`);
  
  // Redirect to our actual handler
  return NextResponse.redirect(redirectUrl);
}

// This is needed to handle OPTIONS requests that might be sent by browsers
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
