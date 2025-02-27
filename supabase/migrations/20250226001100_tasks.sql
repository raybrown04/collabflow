-- Create tasks table
create table tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  due_date timestamptz,
  completed boolean default false,
  priority text check (priority in ('low', 'medium', 'high')),
  created_at timestamptz default now(),
  user_id uuid references auth.users not null
);

-- Add RLS policies
alter table tasks enable row level security;

-- User policies
create policy "Users can view their own tasks"
  on tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on tasks for delete
  using (auth.uid() = user_id);

-- Admin policies (using the app_role column from auth.users)
create policy "Admins can view all tasks"
  on tasks for select
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.app_role = 'admin'
    )
  );

create policy "Admins can insert tasks for any user"
  on tasks for insert
  with check (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.app_role = 'admin'
    )
  );

create policy "Admins can update any task"
  on tasks for update
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.app_role = 'admin'
    )
  );

create policy "Admins can delete any task"
  on tasks for delete
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.app_role = 'admin'
    )
  );

-- Create indexes for better performance
create index tasks_user_id_idx on tasks(user_id);
create index tasks_due_date_idx on tasks(due_date);
create index tasks_completed_idx on tasks(completed);
