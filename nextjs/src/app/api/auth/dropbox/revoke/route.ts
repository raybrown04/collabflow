import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/serverClient";
import { Database } from "@/lib/database.types";

// Dropbox API configuration
const DROPBOX_REVOKE_URL = "https://api.dropboxapi.com/2/auth/token/revoke";
const DROPBOX_APP_KEY = process.env.NEXT_PUBLIC_DROPBOX_APP_KEY || "";
const DROPBOX_APP_SECRET = process.env.DROPBOX_APP_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    // Validate API keys
    if (!DROPBOX_APP_KEY || !DROPBOX_APP_SECRET) {
      return NextResponse.json(
        { error: "Dropbox API credentials not configured" },
        { status: 500 }
      );
    }

    // Get the token to revoke from the request
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Revoke the token
    const revokeResponse = await fetch(DROPBOX_REVOKE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Even if revocation fails with Dropbox, we still want to remove the tokens from our database
    if (!revokeResponse.ok) {
      console.warn("Dropbox token revocation warning:", await revokeResponse.text());
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

    // Remove the tokens from the database
    const { error } = await supabase
      .from("dropbox_auth")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Error removing tokens:", error);
      return NextResponse.json(
        { error: "Failed to remove tokens" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Token revocation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
