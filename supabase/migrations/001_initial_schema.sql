-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- in minutes
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  service_id TEXT NOT NULL, -- Using TEXT to match the frontend service IDs
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Insert default services
INSERT INTO services (name, description, duration, price) VALUES
  ('Swedish Massage', 'Gentle, relaxing massage using long strokes', 60, 120),
  ('Deep Tissue Massage', 'Focused pressure to release muscle tension', 90, 150),
  ('Hot Stone Therapy', 'Heated stones to ease muscle stiffness', 75, 140),
  ('Aromatherapy Massage', 'Essential oils for enhanced relaxation', 60, 130),
  ('Classic Facial', 'Deep cleansing and hydration', 45, 95),
  ('Anti-Aging Facial', 'Reduce fine lines and wrinkles', 60, 125),
  ('Acne Treatment', 'Clear and prevent breakouts', 50, 110),
  ('Body Scrub', 'Exfoliate and moisturize your skin', 45, 85),
  ('Body Wrap', 'Detoxify and nourish your body', 60, 115),
  ('Mud Bath', 'Therapeutic mineral-rich mud treatment', 45, 95);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings
-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own bookings
CREATE POLICY "Users can create own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own bookings
CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- Service admin can view all bookings (you'll need to set up admin role)
CREATE POLICY "Admin can view all bookings" ON bookings
  FOR ALL USING (auth.jwt() ->> 'email' = 'admin@example.com');

-- Everyone can view services
CREATE POLICY "Public can view services" ON services
  FOR SELECT USING (true);

-- Only admin can modify services
CREATE POLICY "Admin can modify services" ON services
  FOR ALL USING (auth.jwt() ->> 'email' = 'admin@example.com');