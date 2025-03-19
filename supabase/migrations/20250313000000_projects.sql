-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- Default blue color
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS policies for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own projects
CREATE POLICY "Users can view their own projects" 
  ON projects FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for users to insert their own projects
CREATE POLICY "Users can insert their own projects" 
  ON projects FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own projects
CREATE POLICY "Users can update their own projects" 
  ON projects FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy for users to delete their own projects
CREATE POLICY "Users can delete their own projects" 
  ON projects FOR DELETE 
  USING (auth.uid() = user_id);

-- Create project_tags junction table
CREATE TABLE IF NOT EXISTS project_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(task_id, project_id)
);

-- Add RLS policies for project_tags
ALTER TABLE project_tags ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own project tags
CREATE POLICY "Users can view their own project tags" 
  ON project_tags FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_tags.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Policy for users to insert their own project tags
CREATE POLICY "Users can insert their own project tags" 
  ON project_tags FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_tags.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Policy for users to delete their own project tags
CREATE POLICY "Users can delete their own project tags" 
  ON project_tags FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_tags.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Create function to get projects for a task
CREATE OR REPLACE FUNCTION get_task_projects(p_task_id UUID)
RETURNS SETOF projects
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT p.* 
  FROM projects p
  JOIN project_tags pt ON p.id = pt.project_id
  WHERE pt.task_id = p_task_id
  AND p.user_id = auth.uid();
$$;

-- Create function to get tasks for a project
CREATE OR REPLACE FUNCTION get_project_tasks(p_project_id UUID)
RETURNS TABLE (
  task_id UUID
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT pt.task_id
  FROM project_tags pt
  JOIN projects p ON p.id = pt.project_id
  WHERE pt.project_id = p_project_id
  AND p.user_id = auth.uid();
$$;

-- Update database.types.ts
COMMENT ON TABLE projects IS 'Stores project information for task organization';
COMMENT ON TABLE project_tags IS 'Junction table linking tasks to projects';
