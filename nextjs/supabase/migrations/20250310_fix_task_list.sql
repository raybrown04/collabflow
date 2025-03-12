-- Fix task list functionality by creating required tables and functions

-- Create todo_list table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.todo_list (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  done BOOLEAN DEFAULT false,
  done_at TIMESTAMP WITH TIME ZONE,
  urgent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  owner UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create task_lists table for organizing tasks
CREATE TABLE IF NOT EXISTS public.task_lists (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  owner UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add list_id column to todo_list if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'todo_list' AND column_name = 'list_id') THEN
    ALTER TABLE public.todo_list ADD COLUMN list_id INTEGER REFERENCES public.task_lists(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- Create user_settings function
CREATE OR REPLACE FUNCTION public.get_user_settings(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  settings JSONB;
BEGIN
  -- For now, return default settings
  -- In the future, this could fetch from a user_settings table
  settings := jsonb_build_object(
    'theme', 'light',
    'notifications', true,
    'default_view', 'calendar',
    'user_id', p_user_id
  );
  
  RETURN settings;
END;
$$;

-- Set up Row Level Security policies
-- Enable RLS on the tables
ALTER TABLE public.todo_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_lists ENABLE ROW LEVEL SECURITY;

-- Create policies for todo_list
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.todo_list;
CREATE POLICY "Users can view their own tasks"
  ON public.todo_list
  FOR SELECT
  USING (owner = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.todo_list;
CREATE POLICY "Users can insert their own tasks"
  ON public.todo_list
  FOR INSERT
  WITH CHECK (owner = auth.uid());

DROP POLICY IF EXISTS "Users can update their own tasks" ON public.todo_list;
CREATE POLICY "Users can update their own tasks"
  ON public.todo_list
  FOR UPDATE
  USING (owner = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.todo_list;
CREATE POLICY "Users can delete their own tasks"
  ON public.todo_list
  FOR DELETE
  USING (owner = auth.uid());

-- Create policies for task_lists
DROP POLICY IF EXISTS "Users can view their own task lists" ON public.task_lists;
CREATE POLICY "Users can view their own task lists"
  ON public.task_lists
  FOR SELECT
  USING (owner = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own task lists" ON public.task_lists;
CREATE POLICY "Users can insert their own task lists"
  ON public.task_lists
  FOR INSERT
  WITH CHECK (owner = auth.uid());

DROP POLICY IF EXISTS "Users can update their own task lists" ON public.task_lists;
CREATE POLICY "Users can update their own task lists"
  ON public.task_lists
  FOR UPDATE
  USING (owner = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own task lists" ON public.task_lists;
CREATE POLICY "Users can delete their own task lists"
  ON public.task_lists
  FOR DELETE
  USING (owner = auth.uid());

-- Insert some default task lists if none exist
INSERT INTO public.task_lists (name, color, owner)
SELECT 'Personal', '#4f46e5', auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM public.task_lists WHERE name = 'Personal' AND owner = auth.uid());

INSERT INTO public.task_lists (name, color, owner)
SELECT 'Work', '#10b981', auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM public.task_lists WHERE name = 'Work' AND owner = auth.uid());
