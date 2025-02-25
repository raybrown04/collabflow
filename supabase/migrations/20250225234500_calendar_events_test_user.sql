-- Add policy for test user ID
CREATE POLICY "Allow test user ID for development"
    ON calendar_events
    FOR ALL
    USING (user_id = 'b9b36d04-59e0-49d7-83ff-46c5186a8cf4' OR auth.uid() = user_id)
    WITH CHECK (user_id = 'b9b36d04-59e0-49d7-83ff-46c5186a8cf4' OR auth.uid() = user_id);

-- Drop existing policies that conflict with the new policy
DROP POLICY IF EXISTS "Users can view their own events" ON calendar_events;
DROP POLICY IF EXISTS "Users can insert their own events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update their own events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete their own events" ON calendar_events;

-- Recreate policies with test user ID exception
CREATE POLICY "Users can view their own events"
    ON calendar_events
    FOR SELECT
    USING (user_id = 'b9b36d04-59e0-49d7-83ff-46c5186a8cf4' OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own events"
    ON calendar_events
    FOR INSERT
    WITH CHECK (user_id = 'b9b36d04-59e0-49d7-83ff-46c5186a8cf4' OR auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
    ON calendar_events
    FOR UPDATE
    USING (user_id = 'b9b36d04-59e0-49d7-83ff-46c5186a8cf4' OR auth.uid() = user_id)
    WITH CHECK (user_id = 'b9b36d04-59e0-49d7-83ff-46c5186a8cf4' OR auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
    ON calendar_events
    FOR DELETE
    USING (user_id = 'b9b36d04-59e0-49d7-83ff-46c5186a8cf4' OR auth.uid() = user_id);
