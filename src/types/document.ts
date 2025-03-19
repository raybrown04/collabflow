// Shared types for document components

// Interface for Dropbox file items
export interface DropboxFile {
  id: string;
  name: string;
  ".tag": "file" | "folder";
  path_lower?: string;
  client_modified?: string;
}

// Interface for document items from the database
export interface Document {
  id: string;
  name: string;
  description?: string | null;
  updated_at?: string;
  projects?: {
    id: string;
    name: string;
    color: string;
  }[];
}
