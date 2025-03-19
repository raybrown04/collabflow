"use server"

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => {
            cookieStore.set(name, value, options);
          },
          remove: (name, options) => {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          }
        }
      }
    );
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get document ID from query params
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("id");
    
    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }
    
    // Check if user has access to the document
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id")
      .eq("id", documentId)
      .eq("user_id", session.user.id)
      .single();
    
    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 }
      );
    }
    
    // Get all versions for the document
    const { data: versions, error: versionsError } = await supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false });
    
    if (versionsError) {
      console.error("Error fetching versions:", versionsError);
      return NextResponse.json(
        { error: "Failed to fetch document versions" },
        { status: 500 }
      );
    }
    
    // Get sync logs for the document
    const { data: syncLogs, error: logsError } = await supabase
      .from("document_sync_log")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false })
      .limit(10);
    
    if (logsError) {
      console.error("Error fetching sync logs:", logsError);
    }
    
    // Enhance version data with user information
    const enhancedVersions = await Promise.all(
      versions.map(async (version) => {
        // Get user info for each version
        const { data: userData } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", version.user_id)
          .single();
        
        return {
          ...version,
          user: userData || { full_name: "Unknown User", avatar_url: null }
        };
      })
    );
    
    return NextResponse.json({
      versions: enhancedVersions,
      syncLogs: syncLogs || []
    });
    
  } catch (error) {
    console.error("Error fetching document versions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
