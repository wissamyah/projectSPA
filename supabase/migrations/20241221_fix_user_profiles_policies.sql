-- Fix user_profiles policies and add admin promotion capability
-- This migration fixes the 500 errors when trying to create/update user profiles

-- 1. Add INSERT policy so users can create their own profile (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles'
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON user_profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 2. Create function to promote user to admin
-- This function allows authenticated users to promote themselves to admin
-- with the correct secret key
CREATE OR REPLACE FUNCTION promote_to_admin(secret_key TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if the secret key is correct
  IF secret_key != 'spa-admin-2024' THEN
    RETURN json_build_object('success', false, 'message', 'Invalid secret key');
  END IF;

  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User not authenticated');
  END IF;

  -- Check if profile exists, if not create it
  INSERT INTO user_profiles (id, role, full_name)
  VALUES (
    auth.uid(),
    'admin',
    COALESCE(
      (SELECT email FROM auth.users WHERE id = auth.uid()),
      'Admin User'
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      updated_at = NOW();

  RETURN json_build_object(
    'success', true,
    'message', 'Successfully promoted to admin',
    'role', 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create function to get or create user profile
-- This ensures a profile always exists for the authenticated user
CREATE OR REPLACE FUNCTION get_or_create_user_profile()
RETURNS TABLE (
  id UUID,
  role TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Try to get existing profile
  RETURN QUERY
  SELECT up.id, up.role, up.full_name, up.phone, up.created_at, up.updated_at
  FROM user_profiles up
  WHERE up.id = auth.uid();

  -- If no rows returned, create a new profile
  IF NOT FOUND THEN
    INSERT INTO user_profiles (id, role, full_name)
    VALUES (
      auth.uid(),
      'customer',
      COALESCE(
        (SELECT au.email FROM auth.users au WHERE au.id = auth.uid()),
        'User'
      )
    );

    -- Return the newly created profile
    RETURN QUERY
    SELECT up.id, up.role, up.full_name, up.phone, up.created_at, up.updated_at
    FROM user_profiles up
    WHERE up.id = auth.uid();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION promote_to_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_staff TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role TO authenticated;