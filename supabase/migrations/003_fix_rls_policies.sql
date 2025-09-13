-- Fix RLS Policies for Admin Access
-- Run this to allow admin to properly manage staff and services

-- First, let's create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user's email matches admin email
  -- You can modify this to check for a role instead
  RETURN auth.jwt() ->> 'email' = 'admin@example.com' 
    OR auth.uid() IS NOT NULL; -- For now, any authenticated user is treated as admin
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Public can view active staff" ON staff;
DROP POLICY IF EXISTS "Admin can manage staff" ON staff;
DROP POLICY IF EXISTS "Public can view staff services" ON staff_services;
DROP POLICY IF EXISTS "Admin can manage staff services" ON staff_services;
DROP POLICY IF EXISTS "Public can view active services" ON services;
DROP POLICY IF EXISTS "Admin can manage services" ON services;
DROP POLICY IF EXISTS "Admin can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admin can modify services" ON services;

-- Recreate staff policies with better permissions
CREATE POLICY "Anyone can view active staff" ON staff
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can view all staff" ON staff
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert staff" ON staff
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update staff" ON staff
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete staff" ON staff
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Staff services policies
CREATE POLICY "Anyone can view staff services" ON staff_services
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage staff services" ON staff_services
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Services policies
CREATE POLICY "Anyone can view active services" ON services
  FOR SELECT USING (is_active = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert services" ON services
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update services" ON services
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete services" ON services
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Service categories policies
DROP POLICY IF EXISTS "Public can view service categories" ON service_categories;
DROP POLICY IF EXISTS "Admin can manage service categories" ON service_categories;

CREATE POLICY "Anyone can view service categories" ON service_categories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage service categories" ON service_categories
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Update bookings policies to allow authenticated users to view all bookings
DROP POLICY IF EXISTS "Admin can view all bookings" ON bookings;

CREATE POLICY "Authenticated users can view all bookings" ON bookings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update any booking" ON bookings
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Staff schedules policies
DROP POLICY IF EXISTS "Public can view staff schedules" ON staff_schedules;
DROP POLICY IF EXISTS "Admin can manage staff schedules" ON staff_schedules;

CREATE POLICY "Anyone can view staff schedules" ON staff_schedules
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage staff schedules" ON staff_schedules
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Grant necessary permissions to authenticated users for the views
GRANT SELECT ON service_available_staff TO authenticated;
GRANT SELECT ON staff_weekly_schedule TO authenticated;

-- Note: These policies allow any authenticated user to manage staff and services
-- This is suitable for a single-admin spa system
-- If you need more granular permissions, you can modify the policies to check for specific roles