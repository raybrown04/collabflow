"use server"

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";

// Dropbox API URL
const DROPBOX_UPLOAD_URL = "https://content.dropboxapi.com/2/files/upload";

export async function POST(req: NextRequest) {
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
    
    // Get request data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const documentId = formData.get("documentId") as string;
    
    if (!file || !documentId) {
      return NextResponse.json(
        { error: "File and document ID are required" },
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
    
    // Get the latest version number
    const { data: versions, error: versionsError } = await supabase
      .from("document_versions")
      .select("version_number")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false })
      .limit(1);
    
    if (versionsError) {
      console.error("Error fetching versions:", versionsError);
      return NextResponse.json(
        { error: "Failed to fetch document versions" },
        { status: 500 }
      );
    }
    
    const latestVersion = versions && versions.length > 0 ? versions[0].version_number : 0;
    const newVersionNumber = latestVersion + 1;
    
    // Generate a path for the file in Dropbox
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileNameParts = document.name.split(".");
    const extension = fileNameParts.length > 1 ? `.${fileNameParts.pop()}` : "";
    const baseName = fileNameParts.join(".");
    const versionedFileName = `${baseName}_v${newVersionNumber}${extension}`;
    const dropboxPath = `/CollabFlow/${timestamp}_${versionedFileName}`;
    
    // Upload file to Dropbox
    const fileBuffer = await file.arrayBuffer();
    const dropboxResponse = await fetch(DROPBOX_UPLOAD_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${dropboxAuth.access_token}`,
        "Dropbox-API-Arg": JSON.stringify({
          path: dropboxPath,
          mode: "add",
          autorename: true,
          mute: false,
          strict_conflict: false
        }),
        "Content-Type": "application/octet-stream"
      },
      body: fileBuffer
    });
    
    if (!dropboxResponse.ok) {
      const errorData = await dropboxResponse.json();
      console.error("Dropbox upload error:", errorData);
      return NextResponse.json(
        { error: "Failed to upload to Dropbox" },
        { status: 500 }
      );
    }
    
    const dropboxData = await dropboxResponse.json();
    
    // Create document version record
    const { data: version, error: versionError } = await supabase
      .from("document_versions")
      .insert({
        document_id: documentId,
        version_number: newVersionNumber,
        file_path: dropboxData.path_display,
        size: file.size,
        user_id: session.user.id
      })
      .select()
      .single();
    
    if (versionError) {
      console.error("Error creating version record:", versionError);
      return NextResponse.json(
        { error: "Failed to create version record" },
        { status: 500 }
      );
    }
    
    // Update document record with new path and size
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        dropbox_path: dropboxData.path_display,
        size: file.size,
        is_synced: true,
        last_synced: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", documentId);
    
    if (updateError) {
      console.error("Error updating document record:", updateError);
    }
    
    // Create sync log entry
    await supabase
      .from("document_sync_log")
      .insert({
        document_id: documentId,
        operation: "upload",
        status: "success",
        user_id: session.user.id
      });
    
    // Update MCP memory graph if available
    try {
      const response = await fetch("/api/mcp/memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "add_observations",
          observations: [{
            entityName: `Document: ${document.name}`,
            contents: [
              `New version ${newVersionNumber} created on ${new Date().toLocaleString()}`,
              `Size: ${Math.round(file.size / 1024)} KB`
            ]
          }]
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
      version,
      versionNumber: newVersionNumber
    });
    
  } catch (error) {
    console.error("Error in document versioning:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
