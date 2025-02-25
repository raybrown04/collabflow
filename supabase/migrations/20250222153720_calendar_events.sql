-- Create calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    date timestamptz NOT NULL,
    type text NOT NULL CHECK (type IN ('meeting', 'task', 'reminder')),
    created_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users NOT NULL
);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own events"
    ON calendar_events
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events"
    ON calendar_events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
    ON calendar_events
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
    ON calendar_events
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX calendar_events_user_id_idx ON calendar_events(user_id);
CREATE INDEX calendar_events_date_idx ON calendar_events(date);
