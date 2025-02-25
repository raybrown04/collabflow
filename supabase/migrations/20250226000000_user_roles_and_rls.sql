-- Create user roles
CREATE TYPE auth_role AS ENUM ('admin', 'user');

-- Add role column to auth.users if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'auth' 
                  AND table_name = 'users' 
                  AND column_name = 'app_role') THEN
        ALTER TABLE auth.users ADD COLUMN app_role auth_role DEFAULT 'user';
    END IF;
END
$$;

-- Set the test user as admin
UPDATE auth.users 
SET app_role = 'admin'
WHERE id = 'b9b36d04-59e0-49d7-83ff-46c5186a8cf4';

-- Create RPC function to get user role
CREATE OR REPLACE FUNCTION get_auth_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT app_role::TEXT INTO user_role
    FROM auth.users
    WHERE id = user_id;
    
    RETURN user_role;
END;
$$;

-- Enable RLS on events table if not already enabled
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for events table
CREATE POLICY "Users can view their own events"
    ON events
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events"
    ON events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
    ON events
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
    ON events
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create admin policies for events table
CREATE POLICY "Admins can view all events"
    ON events
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.app_role = 'admin'
    ));

CREATE POLICY "Admins can insert events"
    ON events
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.app_role = 'admin'
    ));

CREATE POLICY "Admins can update events"
    ON events
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.app_role = 'admin'
    ));

CREATE POLICY "Admins can delete events"
    ON events
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.app_role = 'admin'
    ));

-- Update todo_list policies
DROP POLICY IF EXISTS "Owner can do everything" ON todo_list;

-- Revoke permissions from anon role
REVOKE ALL ON TABLE todo_list FROM anon;

-- Create user policies for todo_list
CREATE POLICY "Users can view their own todos"
    ON todo_list
    FOR SELECT
    USING (owner = auth.uid());

CREATE POLICY "Users can insert their own todos"
    ON todo_list
    FOR INSERT
    WITH CHECK (owner = auth.uid());

CREATE POLICY "Users can update their own todos"
    ON todo_list
    FOR UPDATE
    USING (owner = auth.uid())
    WITH CHECK (owner = auth.uid());

CREATE POLICY "Users can delete their own todos"
    ON todo_list
    FOR DELETE
    USING (owner = auth.uid());

-- Create admin policies for todo_list
CREATE POLICY "Admins can view all todos"
    ON todo_list
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.app_role = 'admin'
    ));

CREATE POLICY "Admins can insert todos"
    ON todo_list
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.app_role = 'admin'
    ));

CREATE POLICY "Admins can update todos"
    ON todo_list
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.app_role = 'admin'
    ));

CREATE POLICY "Admins can delete todos"
    ON todo_list
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.app_role = 'admin'
    ));

-- Update calendar_events policies to include admin role
CREATE POLICY "Admins can view all calendar events"
    ON calendar_events
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.app_role = 'admin'
    ));

CREATE POLICY "Admins can insert calendar events"
    ON calendar_events
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.app_role = 'admin'
    ));

CREATE POLICY "Admins can update calendar events"
    ON calendar_events
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.app_role = 'admin'
    ));

CREATE POLICY "Admins can delete calendar events"
    ON calendar_events
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.app_role = 'admin'
    ));
