-- Migration: Add staff_categories junction table for multi-category staff assignment
-- This allows staff to specialize in multiple service categories

-- 1. Create staff_categories junction table
CREATE TABLE IF NOT EXISTS staff_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, category_id)
);

-- 2. Add indexes for performance
CREATE INDEX idx_staff_categories_staff ON staff_categories(staff_id);
CREATE INDEX idx_staff_categories_category ON staff_categories(category_id);

-- 3. Enable RLS on staff_categories
ALTER TABLE staff_categories ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for staff_categories
CREATE POLICY "Anyone can view staff categories" ON staff_categories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage staff categories" ON staff_categories
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 5. Create a view to easily get staff with their categories
CREATE OR REPLACE VIEW staff_with_categories AS
SELECT 
  s.id as staff_id,
  s.name as staff_name,
  s.email as staff_email,
  s.specialization,
  s.is_active,
  COALESCE(
    array_agg(
      DISTINCT jsonb_build_object(
        'id', sc.id,
        'name', sc.name
      )
    ) FILTER (WHERE sc.id IS NOT NULL),
    ARRAY[]::jsonb[]
  ) as categories
FROM staff s
LEFT JOIN staff_categories stc ON s.id = stc.staff_id
LEFT JOIN service_categories sc ON stc.category_id = sc.id
GROUP BY s.id, s.name, s.email, s.specialization, s.is_active;

-- 6. Create a function to get services by categories for a staff member
CREATE OR REPLACE FUNCTION get_services_by_staff_categories(p_staff_id UUID)
RETURNS TABLE (
  service_id UUID,
  service_name TEXT,
  category_id UUID,
  category_name TEXT,
  duration INTEGER,
  price DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    sv.id as service_id,
    sv.name as service_name,
    sc.id as category_id,
    sc.name as category_name,
    sv.duration,
    sv.price
  FROM staff_categories stc
  JOIN service_categories sc ON stc.category_id = sc.id
  JOIN services sv ON sv.category_id = sc.id
  WHERE stc.staff_id = p_staff_id
    AND sv.is_active = true
  ORDER BY sc.name, sv.name;
END;
$$;

-- 7. Migrate existing staff specializations to categories
-- This attempts to match specializations with existing categories
DO $$
DECLARE
  staff_record RECORD;
  cat_id UUID;
BEGIN
  FOR staff_record IN SELECT id, specialization FROM staff WHERE specialization IS NOT NULL
  LOOP
    -- Try to match specialization to a category
    IF staff_record.specialization LIKE '%Massage%' THEN
      SELECT id INTO cat_id FROM service_categories WHERE name = 'Massage Therapy' LIMIT 1;
      IF cat_id IS NOT NULL THEN
        INSERT INTO staff_categories (staff_id, category_id) 
        VALUES (staff_record.id, cat_id)
        ON CONFLICT (staff_id, category_id) DO NOTHING;
      END IF;
    END IF;
    
    IF staff_record.specialization LIKE '%Esthetician%' OR staff_record.specialization LIKE '%Facial%' THEN
      SELECT id INTO cat_id FROM service_categories WHERE name = 'Facial Treatments' LIMIT 1;
      IF cat_id IS NOT NULL THEN
        INSERT INTO staff_categories (staff_id, category_id) 
        VALUES (staff_record.id, cat_id)
        ON CONFLICT (staff_id, category_id) DO NOTHING;
      END IF;
    END IF;
    
    IF staff_record.specialization LIKE '%Spa%' OR staff_record.specialization LIKE '%Body%' THEN
      SELECT id INTO cat_id FROM service_categories WHERE name = 'Body Treatments' LIMIT 1;
      IF cat_id IS NOT NULL THEN
        INSERT INTO staff_categories (staff_id, category_id) 
        VALUES (staff_record.id, cat_id)
        ON CONFLICT (staff_id, category_id) DO NOTHING;
      END IF;
    END IF;
    
    IF staff_record.specialization LIKE '%Nail%' THEN
      SELECT id INTO cat_id FROM service_categories WHERE name = 'Nail Services' LIMIT 1;
      IF cat_id IS NOT NULL THEN
        INSERT INTO staff_categories (staff_id, category_id) 
        VALUES (staff_record.id, cat_id)
        ON CONFLICT (staff_id, category_id) DO NOTHING;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- 8. Grant permissions for the view and function
GRANT SELECT ON staff_with_categories TO authenticated;
GRANT EXECUTE ON FUNCTION get_services_by_staff_categories TO authenticated;

-- Note: After running this migration:
-- 1. Staff can be assigned to multiple categories
-- 2. When a staff member is assigned to a category, they can perform all services in that category
-- 3. The specialization field becomes more of a title/description rather than functional