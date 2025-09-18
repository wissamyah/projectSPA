-- No need to modify enum since bookings table uses TEXT for status field
-- Just ensure we can use 'completed' as a status value

-- Create archived_bookings table (mirror of bookings table)
CREATE TABLE IF NOT EXISTS archived_bookings (
  id UUID PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  service_id INTEGER,
  service_uuid UUID REFERENCES services(id),
  staff_id UUID REFERENCES staff(id),
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries on archived bookings
CREATE INDEX IF NOT EXISTS idx_archived_bookings_date ON archived_bookings(booking_date DESC);
CREATE INDEX IF NOT EXISTS idx_archived_bookings_customer ON archived_bookings(customer_email);

-- Function to automatically mark past confirmed bookings as completed
CREATE OR REPLACE FUNCTION mark_past_bookings_completed()
RETURNS void AS $$
BEGIN
  UPDATE bookings
  SET status = 'completed',
      updated_at = CURRENT_TIMESTAMP
  WHERE status = 'confirmed'
    AND booking_date < CURRENT_DATE
    OR (booking_date = CURRENT_DATE AND booking_time < CURRENT_TIME - INTERVAL '2 hours');
END;
$$ LANGUAGE plpgsql;

-- Function to archive completed bookings older than 30 days
CREATE OR REPLACE FUNCTION archive_old_bookings()
RETURNS void AS $$
BEGIN
  -- Insert completed bookings older than 30 days into archived_bookings
  INSERT INTO archived_bookings (
    id, customer_name, customer_email, customer_phone,
    service_id, service_uuid, staff_id,
    booking_date, booking_time, status, notes,
    created_at, updated_at, archived_at
  )
  SELECT
    id, customer_name, customer_email, customer_phone,
    service_id, service_uuid, staff_id,
    booking_date, booking_time, status, notes,
    created_at, updated_at, CURRENT_TIMESTAMP
  FROM bookings
  WHERE status = 'completed'
    AND booking_date < CURRENT_DATE - INTERVAL '30 days'
  ON CONFLICT (id) DO NOTHING;

  -- Delete the archived bookings from the main table
  DELETE FROM bookings
  WHERE status = 'completed'
    AND booking_date < CURRENT_DATE - INTERVAL '30 days'
    AND id IN (SELECT id FROM archived_bookings);
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run daily (requires pg_cron extension)
-- Note: This needs to be run as superuser or configured in Supabase dashboard
-- SELECT cron.schedule('mark-completed-bookings', '0 1 * * *', 'SELECT mark_past_bookings_completed();');
-- SELECT cron.schedule('archive-old-bookings', '0 2 * * *', 'SELECT archive_old_bookings();');

-- For manual execution, you can call these functions:
-- SELECT mark_past_bookings_completed();
-- SELECT archive_old_bookings();