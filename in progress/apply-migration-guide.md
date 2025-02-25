# Guide to Apply Migration to Hosted Supabase

This guide provides step-by-step instructions for applying the user roles and RLS policies migration to your hosted Supabase instance.

## Prerequisites

- Access to the Supabase dashboard for your project
- The migration SQL script (`supabase/migrations/20250226000000_user_roles_and_rls.sql`)

## Steps

1. **Log in to the Supabase Dashboard**

   Go to [https://app.supabase.com/](https://app.supabase.com/) and log in with your credentials.

2. **Select Your Project**

   From the dashboard, select your project (`ttbdbkhvgistwrhculrf`).

3. **Open the SQL Editor**

   In the left sidebar, click on "SQL Editor" to open the SQL editor.

4. **Create a New Query**

   Click on the "New Query" button to create a new SQL query.

5. **Copy and Paste the Migration SQL**

   Copy the contents of the migration file (`supabase/migrations/20250226000000_user_roles_and_rls.sql`) and paste it into the SQL editor.

6. **Run the Query**

   Click the "Run" button to execute the SQL query. This will apply the migration to your hosted Supabase instance.

7. **Verify the Migration**

   After running the query, you should verify that the migration was applied successfully:

   - Check that the `auth_role` enum type was created
   - Check that the `app_role` column was added to the `auth.users` table
   - Check that the test user (rsb.3@me.com) was set as an admin
   - Check that the `get_auth_user_role` RPC function was created
   - Check that RLS is enabled on all tables
   - Check that the RLS policies were created for all tables

   You can run the following SQL queries to verify:

   ```sql
   -- Check if auth_role enum exists
   SELECT typname FROM pg_type WHERE typname = 'auth_role';

   -- Check if app_role column exists in auth.users
   SELECT column_name FROM information_schema.columns 
   WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'app_role';

   -- Check if test user is admin
   SELECT id, email, app_role FROM auth.users WHERE id = 'b9b36d04-59e0-49d7-83ff-46c5186a8cf4';

   -- Check if the RPC function exists
   SELECT proname, prorettype::regtype 
   FROM pg_proc 
   WHERE proname = 'get_auth_user_role';

   -- Test the RPC function
   SELECT get_auth_user_role('b9b36d04-59e0-49d7-83ff-46c5186a8cf4');

   -- Check if RLS is enabled on tables
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE schemaname = 'public' AND tablename IN ('calendar_events', 'events', 'todo_list');

   -- Check RLS policies
   SELECT tablename, policyname, permissive, cmd, qual, with_check 
   FROM pg_policies 
   WHERE schemaname = 'public' 
   ORDER BY tablename, policyname;
   ```

## Troubleshooting

If you encounter any errors when running the migration:

1. **Syntax Errors**: Check the SQL syntax for any errors. The Supabase SQL editor will highlight any syntax errors.

2. **Table or Column Already Exists**: If you get an error that a table or column already exists, you can modify the migration to use `IF NOT EXISTS` clauses or wrap the creation in a conditional block.

3. **Permission Errors**: Make sure you have the necessary permissions to create and modify tables and policies.

4. **Policy Conflicts**: If there are conflicts with existing policies, you may need to drop the existing policies first before creating new ones.

## Next Steps

After successfully applying the migration, you should:

1. Test that the RLS policies are working as expected
2. Test the updated components:
   - Verify that the sidebar shows admin-only links for admin users
   - Verify that the events list shows events from other users for admin users
   - Verify that the event form allows admins to create events for other users
   - Verify that regular users can only see and modify their own events
