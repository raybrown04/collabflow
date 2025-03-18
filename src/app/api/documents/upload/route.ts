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
    const projectId = formData.get("projectId") as string;
    const description = formData.get("description") as string;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
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
    
    // Generate a path for the file in Dropbox
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const dropboxPath = `/CollabFlow/${timestamp}_${file.name}`;
    
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
    
    // Create document record in database
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        name: file.name,
        description: description || null,
        dropbox_path: dropboxData.path_display,
        size: file.size,
        mime_type: file.type,
        is_synced: true,
        last_synced: new Date().toISOString(),
        external_url: dropboxData.path_display,
        user_id: session.user.id
      })
      .select()
      .single();
    
    if (docError) {
      console.error("Error creating document record:", docError);
      return NextResponse.json(
        { error: "Failed to create document record" },
        { status: 500 }
      );
    }
    
    // Create document version record
    const { error: versionError } = await supabase
      .from("document_versions")
      .insert({
        document_id: document.id,
        version_number: 1,
        file_path: dropboxData.path_display,
        size: file.size,
        user_id: session.user.id
      });
    
    if (versionError) {
      console.error("Error creating version record:", versionError);
    }
    
    // If projectId is provided, associate document with project
    if (projectId) {
      const { error: projectError } = await supabase
        .from("document_projects")
        .insert({
          document_id: document.id,
          project_id: projectId,
          user_id: session.user.id
        });
      
      if (projectError) {
        console.error("Error associating document with project:", projectError);
      }
    }
    
    // Create sync log entry
    await supabase
      .from("document_sync_log")
      .insert({
        document_id: document.id,
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
          action: "create_entities",
          entities: [{
            name: `Document: ${file.name}`,
            entityType: "Document",
            observations: [
              `Uploaded on ${new Date().toLocaleString()}`,
              `Size: ${Math.round(file.size / 1024)} KB`,
              `Type: ${file.type}`,
              projectId ? `Associated with project: ${projectId}` : "Not associated with any project"
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
      document
    });
    
  } catch (error) {
    console.error("Error in document upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
