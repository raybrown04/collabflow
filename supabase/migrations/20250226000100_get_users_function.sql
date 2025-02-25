-- Create a function to get users with their IDs and emails
CREATE OR REPLACE FUNCTION public.get_users()
RETURNS TABLE (id uuid, email text)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the current user is an admin
  IF (SELECT app_role FROM auth.users WHERE id = auth.uid()) = 'admin' THEN
    -- Return all users
    RETURN QUERY SELECT auth.users.id, auth.users.email::text FROM auth.users;
  ELSE
    -- Return only the current user
    RETURN QUERY SELECT auth.users.id, auth.users.email::text FROM auth.users WHERE id = auth.uid();
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_users() TO authenticated;
