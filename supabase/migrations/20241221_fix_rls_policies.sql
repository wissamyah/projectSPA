-- Fix RLS Policy Issues
-- This migration fixes security vulnerabilities and inconsistencies in RLS policies

-- 1. Fix user_profiles policies
-- Remove duplicate INSERT policy
DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;

-- Fix UPDATE policy - users should NOT be able to change their own role
DROP POLICY IF EXISTS "Users can update own profile including role" ON user_profiles;

-- Create proper UPDATE policy that prevents role changes
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())
  );

-- Add missing Admin update policy
CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (true);

-- 2. Fix calendar_sync_logs policy
DROP POLICY IF EXISTS "Admin can view sync logs" ON calendar_sync_logs;

CREATE POLICY "Admin can view sync logs" ON calendar_sync_logs
  FOR SELECT USING (is_admin());

-- 3. Verify all policies are using the proper functions
-- List current state for verification
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been updated. Run the following to verify:';
  RAISE NOTICE 'SELECT tablename, policyname, action FROM pg_policies WHERE schemaname = ''public'' ORDER BY tablename, policyname;';
END $$;