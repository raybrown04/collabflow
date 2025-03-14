-- Create event_projects junction table
CREATE TABLE IF NOT EXISTS event_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(event_id, project_id)
);

-- Add RLS policies for event_projects
ALTER TABLE event_projects ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own event projects
CREATE POLICY "Users can view their own event projects" 
  ON event_projects FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = event_projects.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Policy for users to insert their own event projects
CREATE POLICY "Users can insert their own event projects" 
  ON event_projects FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = event_projects.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Policy for users to delete their own event projects
CREATE POLICY "Users can delete their own event projects" 
  ON event_projects FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = event_projects.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Create function to get projects for an event
CREATE OR REPLACE FUNCTION get_event_projects(p_event_id UUID)
RETURNS SETOF projects
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT p.* 
  FROM projects p
  JOIN event_projects ep ON p.id = ep.project_id
  WHERE ep.event_id = p_event_id
  AND p.user_id = auth.uid();
$$;

-- Create function to get events for a project
CREATE OR REPLACE FUNCTION get_project_events(p_project_id UUID)
RETURNS TABLE (
  event_id UUID
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT ep.event_id
  FROM event_projects ep
  JOIN projects p ON p.id = ep.project_id
  WHERE ep.project_id = p_project_id
  AND p.user_id = auth.uid();
$$;

-- Update database.types.ts
COMMENT ON TABLE event_projects IS 'Junction table linking calendar events to projects';
