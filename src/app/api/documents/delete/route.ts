"use server"

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";

export async function DELETE(req: NextRequest) {
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
    
    // Get document details to check ownership and get Dropbox path
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", session.user.id)
      .single();
    
    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 }
      );
    }
    
    // Get Dropbox auth tokens
    const { data: dropboxAuth, error: authError } = await supabase
      .from("dropbox_auth")
      .select("access_token")
      .eq("user_id", session.user.id)
      .single();
    
    // Try to delete file from Dropbox if we have auth and a path
    if (dropboxAuth?.access_token && document.dropbox_path) {
      try {
        await fetch("https://api.dropboxapi.com/2/files/delete_v2", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${dropboxAuth.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: document.dropbox_path
          })
        });
      } catch (error) {
        console.error("Error deleting file from Dropbox:", error);
        // Continue with database deletion even if Dropbox deletion fails
      }
    }
    
    // Delete document versions
    const { error: versionsError } = await supabase
      .from("document_versions")
      .delete()
      .eq("document_id", documentId);
    
    if (versionsError) {
      console.error("Error deleting document versions:", versionsError);
    }
    
    // Delete document-project associations
    const { error: projectsError } = await supabase
      .from("document_projects")
      .delete()
      .eq("document_id", documentId);
    
    if (projectsError) {
      console.error("Error deleting document-project associations:", projectsError);
    }
    
    // Delete sync logs
    const { error: logsError } = await supabase
      .from("document_sync_log")
      .delete()
      .eq("document_id", documentId);
    
    if (logsError) {
      console.error("Error deleting sync logs:", logsError);
    }
    
    // Delete document record
    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);
    
    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete document" },
        { status: 500 }
      );
    }
    
    // Update MCP memory graph if available
    try {
      const response = await fetch("/api/mcp/memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete_entities",
          entityNames: [`Document: ${document.name}`]
        })
      });
      
      if (!response.ok) {
        console.warn("Failed to update MCP memory graph");
      }
    } catch (err) {
      console.warn("Error updating MCP memory graph:", err);
    }
    
    return NextResponse.json({
      success: true,
      message: "Document deleted successfully"
    });
    
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
