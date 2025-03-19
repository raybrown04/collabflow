-- Create documents table
create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  file_path text, -- Path in Supabase Storage
  dropbox_path text, -- Path in Dropbox
  size int,
  mime_type text,
  is_synced boolean default false,
  last_synced timestamptz,
  external_url text, -- URL for accessing in Dropbox
  thumbnail_url text, -- URL for thumbnail preview
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  user_id uuid references auth.users not null
);

-- Create document_projects junction table
create table if not exists document_projects (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references documents not null,
  project_id uuid references projects not null,
  created_at timestamptz default now(),
  user_id uuid references auth.users not null,
  unique(document_id, project_id)
);

-- Create dropbox_auth table for storing encrypted API tokens
create table if not exists dropbox_auth (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  access_token text, -- Encrypted in vault
  refresh_token text, -- Encrypted in vault
  account_id text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create document_versions table for version history
create table if not exists document_versions (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references documents not null,
  version_number int not null,
  file_path text not null,
  size int,
  created_at timestamptz default now(),
  user_id uuid references auth.users not null
);

-- Create document_sync_log table for tracking sync operations
create table if not exists document_sync_log (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references documents not null,
  operation text not null check (operation in ('upload', 'download', 'delete', 'rename', 'move')),
  status text not null check (status in ('success', 'failed', 'in_progress')),
  error_message text,
  created_at timestamptz default now(),
  user_id uuid references auth.users not null
);

-- Row Level Security (RLS)
alter table documents enable row level security;
alter table document_projects enable row level security;
alter table dropbox_auth enable row level security;
alter table document_versions enable row level security;
alter table document_sync_log enable row level security;

-- Drop policies if they exist to avoid conflicts
drop policy if exists "Users can view their own documents" on documents;
drop policy if exists "Users can insert their own documents" on documents;
drop policy if exists "Users can update their own documents" on documents;
drop policy if exists "Users can delete their own documents" on documents;

drop policy if exists "Users can view their own document_projects" on document_projects;
drop policy if exists "Users can insert their own document_projects" on document_projects;
drop policy if exists "Users can update their own document_projects" on document_projects;
drop policy if exists "Users can delete their own document_projects" on document_projects;

drop policy if exists "Users can view their own dropbox_auth" on dropbox_auth;
drop policy if exists "Users can insert their own dropbox_auth" on dropbox_auth;
drop policy if exists "Users can update their own dropbox_auth" on dropbox_auth;
drop policy if exists "Users can delete their own dropbox_auth" on dropbox_auth;

drop policy if exists "Users can view their own document_versions" on document_versions;
drop policy if exists "Users can insert their own document_versions" on document_versions;

drop policy if exists "Users can view their own document_sync_log" on document_sync_log;
drop policy if exists "Users can insert their own document_sync_log" on document_sync_log;

-- RLS Policies for documents
create policy "Users can view their own documents"
  on documents for select
  using (auth.uid() = user_id);

create policy "Users can insert their own documents"
  on documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own documents"
  on documents for update
  using (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on documents for delete
  using (auth.uid() = user_id);

-- RLS Policies for document_projects
create policy "Users can view their own document_projects"
  on document_projects for select
  using (auth.uid() = user_id);

create policy "Users can insert their own document_projects"
  on document_projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own document_projects"
  on document_projects for update
  using (auth.uid() = user_id);

create policy "Users can delete their own document_projects"
  on document_projects for delete
  using (auth.uid() = user_id);

-- RLS Policies for dropbox_auth
create policy "Users can view their own dropbox_auth"
  on dropbox_auth for select
  using (auth.uid() = user_id);

create policy "Users can insert their own dropbox_auth"
  on dropbox_auth for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own dropbox_auth"
  on dropbox_auth for update
  using (auth.uid() = user_id);

create policy "Users can delete their own dropbox_auth"
  on dropbox_auth for delete
  using (auth.uid() = user_id);

-- RLS Policies for document_versions
create policy "Users can view their own document_versions"
  on document_versions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own document_versions"
  on document_versions for insert
  with check (auth.uid() = user_id);

-- RLS Policies for document_sync_log
create policy "Users can view their own document_sync_log"
  on document_sync_log for select
  using (auth.uid() = user_id);

create policy "Users can insert their own document_sync_log"
  on document_sync_log for insert
  with check (auth.uid() = user_id);

-- Drop functions if they exist to avoid conflicts
drop function if exists user_has_document_access(uuid);
drop function if exists get_documents_by_project(uuid);

-- Function to check if a user has access to a document
create or replace function user_has_document_access(document_id uuid)
returns boolean
language plpgsql security definer as $$
begin
  return exists (
    select 1 from documents
    where id = document_id
    and user_id = auth.uid()
  );
end;
$$;

-- Create function to get documents by project_id
create or replace function get_documents_by_project(project_id uuid)
returns setof documents
language sql security definer as $$
  select d.*
  from documents d
  join document_projects dp on d.id = dp.document_id
  where dp.project_id = project_id
  and d.user_id = auth.uid()
  order by d.updated_at desc;
$$;
