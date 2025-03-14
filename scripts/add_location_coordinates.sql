-- Add location_coordinates column to calendar_events table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'calendar_events' 
        AND column_name = 'location_coordinates'
    ) THEN
        ALTER TABLE calendar_events 
        ADD COLUMN location_coordinates JSONB DEFAULT NULL;
        RAISE NOTICE 'Added location_coordinates column to calendar_events table';
    ELSE
        RAISE NOTICE 'location_coordinates column already exists in calendar_events table';
    END IF;
END $$;
