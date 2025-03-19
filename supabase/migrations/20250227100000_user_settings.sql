-- Create user_settings table
create table user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  theme text default 'light' check (theme in ('light', 'dark', 'system')),
  notification_email boolean default true,
  notification_push boolean default true,
  notification_calendar_reminders boolean default true,
  notification_task_reminders boolean default true,
  date_format text default 'MM/DD/YYYY',
  time_format text default '12h',
  first_day_of_week integer default 0 check (first_day_of_week between 0 and 6),
  language text default 'en',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add RLS policies
alter table user_settings enable row level security;

create policy "Users can view their own settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on user_settings for update
  using (auth.uid() = user_id);

-- Create function to get or create user settings
create or replace function get_user_settings(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  settings json;
begin
  -- Try to get existing settings
  select row_to_json(us)
  into settings
  from user_settings us
  where user_id = p_user_id;
  
  -- If no settings exist, create default settings
  if settings is null then
    insert into user_settings (user_id)
    values (p_user_id)
    returning row_to_json(user_settings) into settings;
  end if;
  
  return settings;
end;
$$;

-- Add trigger to update the updated_at timestamp
create or replace function update_user_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_user_settings_updated_at
before update on user_settings
for each row
execute function update_user_settings_updated_at();
