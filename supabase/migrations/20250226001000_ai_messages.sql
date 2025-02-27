-- Create AI messages table for chat history
create table ai_messages (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  is_user boolean not null,
  assistant_type text not null default 'personal',
  created_at timestamptz default now(),
  user_id uuid references auth.users not null
);

-- Enable Row Level Security
alter table ai_messages enable row level security;

-- User policies
create policy "Users can view their own messages"
  on ai_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert their own messages"
  on ai_messages for insert
  with check (auth.uid() = user_id);

-- Admin policies
create policy "Admins can view all AI messages"
  on ai_messages for select
  using (auth.jwt() ? 'app_role' && auth.jwt()->>'app_role' = 'admin');

create policy "Admins can insert AI messages for any user"
  on ai_messages for insert
  with check (auth.jwt() ? 'app_role' && auth.jwt()->>'app_role' = 'admin');

create policy "Admins can update any AI messages"
  on ai_messages for update
  using (auth.jwt() ? 'app_role' && auth.jwt()->>'app_role' = 'admin');

create policy "Admins can delete any AI messages"
  on ai_messages for delete
  using (auth.jwt() ? 'app_role' && auth.jwt()->>'app_role' = 'admin');

-- Create index on user_id and assistant_type for faster queries
create index idx_ai_messages_user_id on ai_messages(user_id);
create index idx_ai_messages_assistant_type on ai_messages(assistant_type);
create index idx_ai_messages_created_at on ai_messages(created_at);

-- Add composite index for common query pattern
create index idx_ai_messages_user_assistant_created on ai_messages(user_id, assistant_type, created_at desc);
