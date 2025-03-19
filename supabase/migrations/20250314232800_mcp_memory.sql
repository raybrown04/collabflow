-- Migration for MCP memory integration
-- Creates tables for storing MCP entities and relations

-- Create mcp_entities table
CREATE TABLE IF NOT EXISTS mcp_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  observations TEXT[] DEFAULT '{}',
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (name, entity_type)
);

-- Create mcp_relations table
CREATE TABLE IF NOT EXISTS mcp_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_entity TEXT NOT NULL,
  to_entity TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (from_entity, to_entity, relation_type)
);

-- Add RLS policies
ALTER TABLE mcp_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_relations ENABLE ROW LEVEL SECURITY;

-- Users can view their own entities
CREATE POLICY "Users can view their own entities"
  ON mcp_entities FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own entities
CREATE POLICY "Users can insert their own entities"
  ON mcp_entities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own entities
CREATE POLICY "Users can update their own entities"
  ON mcp_entities FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own entities
CREATE POLICY "Users can delete their own entities"
  ON mcp_entities FOR DELETE
  USING (auth.uid() = user_id);

-- Users can view their own relations
CREATE POLICY "Users can view their own relations"
  ON mcp_relations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own relations
CREATE POLICY "Users can insert their own relations"
  ON mcp_relations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own relations
CREATE POLICY "Users can update their own relations"
  ON mcp_relations FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own relations
CREATE POLICY "Users can delete their own relations"
  ON mcp_relations FOR DELETE
  USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all entities"
  ON mcp_entities FOR SELECT
  USING (
    (SELECT app_role FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can view all relations"
  ON mcp_relations FOR SELECT
  USING (
    (SELECT app_role FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mcp_entities_name ON mcp_entities (name);
CREATE INDEX IF NOT EXISTS idx_mcp_entities_entity_type ON mcp_entities (entity_type);
CREATE INDEX IF NOT EXISTS idx_mcp_entities_user_id ON mcp_entities (user_id);

CREATE INDEX IF NOT EXISTS idx_mcp_relations_from_entity ON mcp_relations (from_entity);
CREATE INDEX IF NOT EXISTS idx_mcp_relations_to_entity ON mcp_relations (to_entity);
CREATE INDEX IF NOT EXISTS idx_mcp_relations_relation_type ON mcp_relations (relation_type);
CREATE INDEX IF NOT EXISTS idx_mcp_relations_user_id ON mcp_relations (user_id);
