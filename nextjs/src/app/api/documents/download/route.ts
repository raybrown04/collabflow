"use server"

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";

// Dropbox API URL
const DROPBOX_DOWNLOAD_URL = "https://content.dropboxapi.com/2/files/download";

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
    const versionNumber = searchParams.get("version");
    
    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }
    
    // Get document details
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
    
    // If version is specified, get that version's path
    let filePath = document.dropbox_path;
    
    if (versionNumber) {
      const { data: version, error: versionError } = await supabase
        .from("document_versions")
        .select("file_path")
        .eq("document_id", documentId)
        .eq("version_number", versionNumber)
        .eq("user_id", session.user.id)
        .single();
      
      if (versionError || !version) {
        return NextResponse.json(
          { error: "Version not found" },
          { status: 404 }
        );
      }
      
      filePath = version.file_path;
    }
    
    // Get Dropbox auth tokens
    const { data: dropboxAuth, error: authError } = await supabase
      .from("dropbox_auth")
      .select("access_token")
      .eq("user_id", session.user.id)
      .single();
    
    if (authError || !dropboxAuth?.access_token) {
      return NextResponse.json(
        { error: "Dropbox not connected" },
        { status: 400 }
      );
    }
    
    // Download file from Dropbox
    const dropboxResponse = await fetch(DROPBOX_DOWNLOAD_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${dropboxAuth.access_token}`,
        "Dropbox-API-Arg": JSON.stringify({
          path: filePath
        })
      }
    });
    
    if (!dropboxResponse.ok) {
      console.error("Dropbox download error:", await dropboxResponse.text());
      return NextResponse.json(
        { error: "Failed to download from Dropbox" },
        { status: 500 }
      );
    }
    
    // Get file content and headers
    const fileContent = await dropboxResponse.arrayBuffer();
    const fileMetadata = JSON.parse(dropboxResponse.headers.get("dropbox-api-result") || "{}");
    
    // Create sync log entry
    await supabase
      .from("document_sync_log")
      .insert({
        document_id: document.id,
        operation: "download",
        status: "success",
        user_id: session.user.id
      });
    
    // Return file as download
    const response = new NextResponse(fileContent);
    
    // Set appropriate headers for file download
    response.headers.set("Content-Type", document.mime_type || "application/octet-stream");
    response.headers.set("Content-Disposition", `attachment; filename="${document.name}"`);
    response.headers.set("Content-Length", fileMetadata.size?.toString() || "");
    
    return response;
    
  } catch (error) {
    console.error("Error in document download:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
