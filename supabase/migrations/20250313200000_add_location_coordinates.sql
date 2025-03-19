-- Add location_coordinates column to calendar_events table
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS location_coordinates JSONB DEFAULT NULL;
