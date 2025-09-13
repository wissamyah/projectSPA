-- Migration: Add Staff Management and Update Services System
-- Run this after 001_initial_schema.sql

-- 1. Create service categories table
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  specialization TEXT, -- e.g., "Massage Therapist", "Esthetician", "Nail Technician"
  bio TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  hire_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Backup existing services data before modifying
CREATE TEMP TABLE services_backup AS SELECT * FROM services;

-- 4. Drop the old services table (we'll recreate with better structure)
DROP TABLE IF EXISTS services CASCADE;

-- 5. Create new improved services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- in minutes
  price DECIMAL(10,2) NOT NULL,
  max_concurrent INTEGER DEFAULT 1, -- how many can be booked at same time
  requires_room BOOLEAN DEFAULT true, -- some services might not need a room
  is_active BOOLEAN DEFAULT true, -- to disable services without deleting
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create junction table for staff-services relationship
CREATE TABLE IF NOT EXISTS staff_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false, -- is this their main service
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, service_id)
);

-- 7. Add staff_id to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES staff(id) ON DELETE SET NULL;

-- 8. Add service_id as UUID to bookings (currently it's TEXT)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS service_uuid UUID REFERENCES services(id) ON DELETE SET NULL;

-- 9. Create staff availability/schedule table (for future use)
CREATE TABLE IF NOT EXISTS staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, day_of_week)
);

-- 10. Insert service categories
INSERT INTO service_categories (name, display_order) VALUES
  ('Massage Therapy', 1),
  ('Facial Treatments', 2),
  ('Body Treatments', 3),
  ('Nail Services', 4),
  ('Special Packages', 5);

-- 11. Re-insert services with categories and improved structure
INSERT INTO services (name, description, duration, price, category_id, max_concurrent, display_order)
SELECT 
  name,
  description,
  duration,
  price,
  CASE 
    WHEN name LIKE '%Massage%' OR name LIKE '%Therapy%' THEN 
      (SELECT id FROM service_categories WHERE name = 'Massage Therapy')
    WHEN name LIKE '%Facial%' OR name LIKE '%Acne%' THEN 
      (SELECT id FROM service_categories WHERE name = 'Facial Treatments')
    ELSE 
      (SELECT id FROM service_categories WHERE name = 'Body Treatments')
  END as category_id,
  1 as max_concurrent, -- default to 1, admin can change later
  ROW_NUMBER() OVER (ORDER BY name) as display_order
FROM services_backup;

-- 12. Insert sample staff members
INSERT INTO staff (name, email, phone, specialization, bio) VALUES
  ('Sarah Johnson', 'sarah@spa.com', '555-0101', 'Senior Massage Therapist', 'Certified massage therapist with 10 years experience in Swedish and deep tissue massage.'),
  ('Michael Chen', 'michael@spa.com', '555-0102', 'Massage Therapist', 'Specializes in therapeutic and sports massage techniques.'),
  ('Emma Wilson', 'emma@spa.com', '555-0103', 'Esthetician', 'Expert in facial treatments and skincare with focus on anti-aging treatments.'),
  ('David Martinez', 'david@spa.com', '555-0104', 'Spa Therapist', 'Versatile therapist skilled in body treatments and relaxation techniques.'),
  ('Lisa Thompson', 'lisa@spa.com', '555-0105', 'Senior Esthetician', 'Skincare specialist with expertise in acne treatment and facial rejuvenation.');

-- 13. Assign staff to services (sample assignments)
-- Massage therapists can do all massage services
INSERT INTO staff_services (staff_id, service_id, is_primary)
SELECT 
  s.id as staff_id,
  sv.id as service_id,
  true as is_primary
FROM staff s
CROSS JOIN services sv
WHERE s.specialization LIKE '%Massage%' 
  AND sv.category_id = (SELECT id FROM service_categories WHERE name = 'Massage Therapy');

-- Estheticians can do all facial services
INSERT INTO staff_services (staff_id, service_id, is_primary)
SELECT 
  s.id as staff_id,
  sv.id as service_id,
  true as is_primary
FROM staff s
CROSS JOIN services sv
WHERE s.specialization LIKE '%Esthetician%' 
  AND sv.category_id = (SELECT id FROM service_categories WHERE name = 'Facial Treatments');

-- Spa therapists can do body treatments
INSERT INTO staff_services (staff_id, service_id, is_primary)
SELECT 
  s.id as staff_id,
  sv.id as service_id,
  false as is_primary
FROM staff s
CROSS JOIN services sv
WHERE s.specialization = 'Spa Therapist' 
  AND sv.category_id = (SELECT id FROM service_categories WHERE name = 'Body Treatments');

-- 14. Create indexes for performance
CREATE INDEX idx_staff_services_staff ON staff_services(staff_id);
CREATE INDEX idx_staff_services_service ON staff_services(service_id);
CREATE INDEX idx_bookings_staff ON bookings(staff_id);
CREATE INDEX idx_bookings_service_uuid ON bookings(service_uuid);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_staff_active ON staff(is_active);

-- 15. Create views for easier querying

-- View: Available staff for each service
CREATE OR REPLACE VIEW service_available_staff AS
SELECT 
  s.id as service_id,
  s.name as service_name,
  st.id as staff_id,
  st.name as staff_name,
  ss.is_primary
FROM services s
JOIN staff_services ss ON s.id = ss.service_id
JOIN staff st ON ss.staff_id = st.id
WHERE s.is_active = true AND st.is_active = true;

-- View: Staff weekly schedule with bookings
CREATE OR REPLACE VIEW staff_weekly_schedule AS
SELECT 
  b.booking_date,
  b.booking_time,
  b.status,
  s.name as service_name,
  s.duration as service_duration,
  st.name as staff_name,
  st.id as staff_id,
  c.customer_name,
  c.customer_phone
FROM bookings b
LEFT JOIN services s ON b.service_uuid = s.id
LEFT JOIN staff st ON b.staff_id = st.id
LEFT JOIN (
  SELECT id, customer_name, customer_phone FROM bookings
) c ON b.id = c.id
WHERE b.status IN ('confirmed', 'pending')
ORDER BY b.booking_date, b.booking_time;

-- 16. Update RLS policies

-- Enable RLS on new tables
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;

-- Staff table policies
CREATE POLICY "Public can view active staff" ON staff
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage staff" ON staff
  FOR ALL USING (auth.jwt() ->> 'email' = 'admin@example.com');

-- Staff services policies
CREATE POLICY "Public can view staff services" ON staff_services
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage staff services" ON staff_services
  FOR ALL USING (auth.jwt() ->> 'email' = 'admin@example.com');

-- Service categories policies
CREATE POLICY "Public can view service categories" ON service_categories
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage service categories" ON service_categories
  FOR ALL USING (auth.jwt() ->> 'email' = 'admin@example.com');

-- Staff schedules policies
CREATE POLICY "Public can view staff schedules" ON staff_schedules
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage staff schedules" ON staff_schedules
  FOR ALL USING (auth.jwt() ->> 'email' = 'admin@example.com');

-- Update services policies (since we recreated the table)
CREATE POLICY "Public can view active services" ON services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage services" ON services
  FOR ALL USING (auth.jwt() ->> 'email' = 'admin@example.com');

-- 17. Create functions for complex queries

-- Function: Get available staff for a specific service and time
CREATE OR REPLACE FUNCTION get_available_staff(
  p_service_id UUID,
  p_booking_date DATE,
  p_booking_time TIME
)
RETURNS TABLE (
  staff_id UUID,
  staff_name TEXT,
  staff_email TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    st.id,
    st.name,
    st.email
  FROM staff st
  JOIN staff_services ss ON st.id = ss.staff_id
  WHERE 
    ss.service_id = p_service_id
    AND st.is_active = true
    AND st.id NOT IN (
      -- Exclude staff who are already booked at this time
      SELECT staff_id 
      FROM bookings b
      JOIN services s ON b.service_uuid = s.id
      WHERE 
        b.booking_date = p_booking_date
        AND b.status IN ('confirmed', 'pending')
        AND b.staff_id IS NOT NULL
        AND (
          -- Check for time overlap
          (b.booking_time <= p_booking_time AND 
           b.booking_time + (s.duration || ' minutes')::INTERVAL > p_booking_time)
        )
    );
END;
$$;

-- 18. Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: After running this migration, you'll need to:
-- 1. Update the frontend to use service UUIDs instead of hardcoded IDs
-- 2. Update booking logic to assign staff members
-- 3. Implement the staff and service management UI