-- Create task lists table
CREATE TABLE task_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3498db',
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies for task_lists
ALTER TABLE task_lists ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view their own task lists"
  ON task_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task lists"
  ON task_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task lists"
  ON task_lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task lists"
  ON task_lists FOR DELETE
  USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all task lists"
  ON task_lists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.app_role = 'admin'
    )
  );

CREATE POLICY "Admins can insert task lists for any user"
  ON task_lists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.app_role = 'admin'
    )
  );

CREATE POLICY "Admins can update any task list"
  ON task_lists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.app_role = 'admin'
    )
  );

CREATE POLICY "Admins can delete any task list"
  ON task_lists FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.app_role = 'admin'
    )
  );

-- Add list_id to tasks table
ALTER TABLE tasks ADD COLUMN list_id UUID REFERENCES task_lists;

-- Create default lists for existing users
INSERT INTO task_lists (name, color, user_id)
SELECT 'Personal', '#E91E63', auth.users.id
FROM auth.users;

-- Create indexes for better performance
CREATE INDEX task_lists_user_id_idx ON task_lists(user_id);
