# Supabase Query Analysis

## Query Patterns by Page

### Book.tsx (Customer Booking Page)
**Most Critical for Performance - High Traffic**
1. Load services with staff (on mount & service changes)
2. Load staff for selected service
3. Load existing bookings for availability check
4. Get service details when staff selected
5. Create new booking
6. Update booking

### Admin.tsx (Admin Dashboard)
1. Load services list
2. Load staff list
3. Count pending bookings
4. Load next available dates
5. Load all bookings with joins
6. Update booking status
7. Check availability for rescheduling
8. Reschedule booking

### AdminSchedule.tsx
1. Load all active staff
2. Load bookings with service/staff joins (filtered by date range)

### AdminArchive.tsx
1. Load archived bookings with joins
2. Restore booking (insert + delete)

### AdminCategories.tsx
1. Load service categories
2. Create/Update/Delete categories

### AdminServices.tsx
1. Load services with category
2. Load categories for dropdown
3. Create/Update/Delete services

### AdminStaff.tsx
1. Load staff members
2. Load services for assignment
3. Create/Update/Delete staff

### AdminSettings.tsx
1. Load business settings
2. Update business settings

### Dashboard.tsx
1. Load user bookings
2. Cancel booking

### Landing.tsx
1. Load services list (public)

### Services.tsx
1. Load services grouped by category

### StaffSchedule.tsx
1. Load staff member details
2. Load staff bookings

## Key Observations

### High-Frequency Queries (Need Aggressive Caching)
- Services list (used everywhere)
- Staff list (used in multiple pages)
- Service categories (rarely changes)

### Medium-Frequency Queries (Moderate Caching)
- Bookings by date (changes frequently)
- Staff availability (changes during booking)

### Low-Frequency Queries (Minimal/No Caching)
- Individual booking updates
- Admin settings
- Archive operations

## Caching Strategy Recommendations

### Static Data (5-10 min cache)
- Services list
- Service categories
- Business hours/settings

### Semi-Static Data (1-2 min cache)
- Staff list
- Staff-service assignments

### Dynamic Data (30s cache with real-time updates)
- Bookings grid
- Availability checks

### No Cache (Real-time)
- Booking mutations
- Status updates
- Archive operations