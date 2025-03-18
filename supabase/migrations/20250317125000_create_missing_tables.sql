-- Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  color text DEFAULT '#4f46e5',
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  file_path text, -- Path in Supabase Storage
  dropbox_path text, -- Path in Dropbox
  size int,
  mime_type text,
  is_synced boolean DEFAULT false,
  last_synced timestamptz,
  external_url text, -- URL for accessing in Dropbox
  thumbnail_url text, -- URL for thumbnail preview
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL
);

-- Create document_projects junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS document_projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid REFERENCES documents NOT NULL,
  project_id uuid REFERENCES projects NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL,
  UNIQUE(document_id, project_id)
);

-- Create dropbox_auth table for storing encrypted API tokens if it doesn't exist
CREATE TABLE IF NOT EXISTS dropbox_auth (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  access_token text, -- Encrypted in vault
  refresh_token text, -- Encrypted in vault
  account_id text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document_versions table for version history if it doesn't exist
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid REFERENCES documents NOT NULL,
  version_number int NOT NULL,
  file_path text NOT NULL,
  size int,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL
);

-- Create document_sync_log table for tracking sync operations if it doesn't exist
CREATE TABLE IF NOT EXISTS document_sync_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid REFERENCES documents NOT NULL,
  operation text NOT NULL CHECK (operation IN ('upload', 'download', 'delete', 'rename', 'move')),
  status text NOT NULL CHECK (status IN ('success', 'failed', 'in_progress')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropbox_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sync_log ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;

DROP POLICY IF EXISTS "Users can view their own document_projects" ON document_projects;
DROP POLICY IF EXISTS "Users can insert their own document_projects" ON document_projects;
DROP POLICY IF EXISTS "Users can update their own document_projects" ON document_projects;
DROP POLICY IF EXISTS "Users can delete their own document_projects" ON document_projects;

DROP POLICY IF EXISTS "Users can view their own dropbox_auth" ON dropbox_auth;
DROP POLICY IF EXISTS "Users can insert their own dropbox_auth" ON dropbox_auth;
DROP POLICY IF EXISTS "Users can update their own dropbox_auth" ON dropbox_auth;
DROP POLICY IF EXISTS "Users can delete their own dropbox_auth" ON dropbox_auth;

DROP POLICY IF EXISTS "Users can view their own document_versions" ON document_versions;
DROP POLICY IF EXISTS "Users can insert their own document_versions" ON document_versions;

DROP POLICY IF EXISTS "Users can view their own document_sync_log" ON document_sync_log;
DROP POLICY IF EXISTS "Users can insert their own document_sync_log" ON document_sync_log;

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for documents
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for document_projects
CREATE POLICY "Users can view their own document_projects"
  ON document_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own document_projects"
  ON document_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own document_projects"
  ON document_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own document_projects"
  ON document_projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for dropbox_auth
CREATE POLICY "Users can view their own dropbox_auth"
  ON dropbox_auth FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dropbox_auth"
  ON dropbox_auth FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dropbox_auth"
  ON dropbox_auth FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dropbox_auth"
  ON dropbox_auth FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for document_versions
CREATE POLICY "Users can view their own document_versions"
  ON document_versions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own document_versions"
  ON document_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for document_sync_log
CREATE POLICY "Users can view their own document_sync_log"
  ON document_sync_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own document_sync_log"
  ON document_sync_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Drop functions if they exist to avoid conflicts
DROP FUNCTION IF EXISTS user_has_document_access(uuid);
DROP FUNCTION IF EXISTS get_documents_by_project(uuid);

-- Function to check if a user has access to a document
CREATE OR REPLACE FUNCTION user_has_document_access(document_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM documents
    WHERE id = document_id
    AND user_id = auth.uid()
  );
END;
$$;

-- Create function to get documents by project_id
CREATE OR REPLACE FUNCTION get_documents_by_project(project_id uuid)
RETURNS SETOF documents
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT d.*
  FROM documents d
  JOIN document_projects dp ON d.id = dp.document_id
  WHERE dp.project_id = project_id
  AND d.user_id = auth.uid()
  ORDER BY d.updated_at DESC;
$$;

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
