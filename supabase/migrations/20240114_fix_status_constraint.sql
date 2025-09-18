-- Drop the existing check constraint if it exists
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add a new check constraint that includes 'completed'
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));

-- Also ensure the archived_bookings table can accept all status values
ALTER TABLE archived_bookings DROP CONSTRAINT IF EXISTS archived_bookings_status_check;
ALTER TABLE archived_bookings ADD CONSTRAINT archived_bookings_status_check
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));