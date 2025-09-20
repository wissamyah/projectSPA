-- Add User Roles System
-- This migration adds a proper role-based access control system

-- 1. Create user_profiles table to store user metadata including roles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for user_profiles
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (but not change their role)
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM user_profiles WHERE id = auth.uid()));

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'customer')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to check if user is staff
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Migrate existing users to user_profiles
-- First, check if admin email exists in localStorage (from setup)
-- For now, we'll set the first user or specific email as admin
INSERT INTO user_profiles (id, full_name, role)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', email),
  CASE
    -- Set admin based on specific emails or first user
    WHEN email IN ('admin@spa.com', 'admin@example.com') THEN 'admin'
    WHEN email = (SELECT email FROM auth.users ORDER BY created_at LIMIT 1) THEN 'admin'
    ELSE 'customer'
  END
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.users.id
);

-- 10. Update RLS policies for bookings table
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can update any booking" ON bookings;

-- Customers can only see their own bookings
CREATE POLICY "Customers can view own bookings" ON bookings
  FOR SELECT USING (
    auth.uid() = user_id OR
    is_admin() OR
    is_staff()
  );

-- Customers can create their own bookings
CREATE POLICY "Customers can create bookings" ON bookings
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Customers can update their own bookings
CREATE POLICY "Customers can update own bookings" ON bookings
  FOR UPDATE USING (
    auth.uid() = user_id OR
    is_admin() OR
    is_staff()
  );

-- Admins and staff can delete bookings
CREATE POLICY "Admin and staff can delete bookings" ON bookings
  FOR DELETE USING (is_admin() OR is_staff());

-- 11. Update RLS policies for services table
DROP POLICY IF EXISTS "Anyone can view active services" ON services;
DROP POLICY IF EXISTS "Authenticated users can insert services" ON services;
DROP POLICY IF EXISTS "Authenticated users can update services" ON services;
DROP POLICY IF EXISTS "Authenticated users can delete services" ON services;

-- Everyone can view active services
CREATE POLICY "Public can view active services" ON services
  FOR SELECT USING (is_active = true OR is_admin() OR is_staff());

-- Only admins can manage services
CREATE POLICY "Admins can insert services" ON services
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update services" ON services
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete services" ON services
  FOR DELETE USING (is_admin());

-- 12. Update RLS policies for staff table
DROP POLICY IF EXISTS "Anyone can view active staff" ON staff;
DROP POLICY IF EXISTS "Authenticated users can view all staff" ON staff;
DROP POLICY IF EXISTS "Authenticated users can insert staff" ON staff;
DROP POLICY IF EXISTS "Authenticated users can update staff" ON staff;
DROP POLICY IF EXISTS "Authenticated users can delete staff" ON staff;

-- Everyone can view active staff
CREATE POLICY "Public can view active staff" ON staff
  FOR SELECT USING (is_active = true OR is_admin() OR is_staff());

-- Only admins can manage staff
CREATE POLICY "Admins can insert staff" ON staff
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update staff" ON staff
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete staff" ON staff
  FOR DELETE USING (is_admin());

-- 13. Update RLS policies for service_categories
DROP POLICY IF EXISTS "Anyone can view service categories" ON service_categories;
DROP POLICY IF EXISTS "Authenticated users can manage service categories" ON service_categories;

CREATE POLICY "Public can view service categories" ON service_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage service categories" ON service_categories
  FOR ALL USING (is_admin());

-- 14. Update RLS policies for staff_services
DROP POLICY IF EXISTS "Anyone can view staff services" ON staff_services;
DROP POLICY IF EXISTS "Authenticated users can manage staff services" ON staff_services;

CREATE POLICY "Public can view staff services" ON staff_services
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage staff services" ON staff_services
  FOR ALL USING (is_admin());

-- 15. Update RLS policies for staff_schedules
DROP POLICY IF EXISTS "Anyone can view staff schedules" ON staff_schedules;
DROP POLICY IF EXISTS "Authenticated users can manage staff schedules" ON staff_schedules;

CREATE POLICY "Public can view staff schedules" ON staff_schedules
  FOR SELECT USING (true);

CREATE POLICY "Admins and staff can manage staff schedules" ON staff_schedules
  FOR ALL USING (is_admin() OR is_staff());

-- 16. Update RLS policies for staff_categories
DROP POLICY IF EXISTS "Anyone can view staff categories" ON staff_categories;
DROP POLICY IF EXISTS "Authenticated users can manage staff categories" ON staff_categories;

CREATE POLICY "Public can view staff categories" ON staff_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage staff categories" ON staff_categories
  FOR ALL USING (is_admin());

-- Note: After running this migration:
-- 1. Update the Setup page to set the user role to 'admin' when creating the first admin
-- 2. You may need to manually update specific users to have admin role using:
--    UPDATE user_profiles SET role = 'admin' WHERE id = 'USER_UUID_HERE';