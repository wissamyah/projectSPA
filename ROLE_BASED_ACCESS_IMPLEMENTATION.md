# Role-Based Access Control Implementation

## Overview
I've successfully implemented a comprehensive role-based access control (RBAC) system that separates customer and admin users, ensuring proper access control throughout your spa booking application.

## Database Changes

### SQL Migration Required
Please run the following SQL migration file in your Supabase SQL editor:
- **File**: `supabase/migrations/20241220_add_user_roles.sql`

This migration will:
1. Create a `user_profiles` table to store user roles
2. Add role-based functions (`is_admin()`, `is_staff()`, `get_user_role()`)
3. Update all RLS policies to respect user roles
4. Automatically migrate existing users (first user becomes admin)

### User Roles
The system now supports three roles:
- **customer**: Default role for all new users (can book appointments, view their own bookings)
- **admin**: Full access to admin dashboard and all management features
- **staff**: Future role for staff members (partially implemented)

## Frontend Changes

### 1. Authentication Context (`src/contexts/AuthContext.tsx`)
- Centralized authentication and role management
- Provides `isAdmin` and `isStaff` flags throughout the app
- Automatically fetches and caches user roles

### 2. Protected Admin Routes (`src/components/AdminRoute.tsx`)
- Wraps all admin routes to ensure only admin users can access them
- Redirects non-admin users to the customer dashboard

### 3. Updated Navigation (`src/components/shared/Navbar.tsx`)
- Admin link only visible to admin users
- Shows a shield icon next to "Admin" for visual clarity
- Proper role-based menu rendering

### 4. Setup Page Enhancement (`src/pages/Setup.tsx`)
- Automatically sets the first user as admin during setup
- Creates user profile with admin role

## How It Works

### Customer Flow:
1. Customer signs up → Gets `customer` role automatically
2. Can access: Landing, Services, Book, Dashboard (their bookings only)
3. Cannot access: Admin pages (redirected to customer dashboard)

### Admin Flow:
1. Admin created via Setup page → Gets `admin` role
2. Can access: All customer pages + Admin dashboard
3. Full CRUD operations on services, staff, bookings, etc.

## Manual Admin Creation

If you need to manually make an existing user an admin, run this SQL in Supabase:

```sql
UPDATE user_profiles
SET role = 'admin'
WHERE id = 'USER_UUID_HERE';
```

To find a user's UUID:
```sql
SELECT id, email FROM auth.users WHERE email = 'user@example.com';
```

## Testing the Implementation

1. **Run the SQL migration** in Supabase SQL editor
2. **Test as Customer**:
   - Sign up with a new account
   - Verify you can only see Dashboard (not Admin)
   - Verify you can only see your own bookings

3. **Test as Admin**:
   - Use the Setup page to create admin OR
   - Manually update an existing user's role
   - Verify Admin link appears in navbar
   - Verify access to all admin pages
   - Verify you can see all bookings

## Important Notes

1. **First User as Admin**: The migration automatically makes the first user in your database an admin
2. **Email-based Admin**: Users with emails `admin@spa.com` or `admin@example.com` are automatically set as admin
3. **Security**: All admin routes are protected both on frontend (routing) and backend (RLS policies)
4. **Fallback**: If a user's profile doesn't exist, they default to `customer` role

## Troubleshooting

If the admin role isn't working:

1. Check if user_profiles table exists:
```sql
SELECT * FROM user_profiles WHERE id = auth.uid();
```

2. Manually create/update profile:
```sql
INSERT INTO user_profiles (id, role, full_name)
VALUES (auth.uid(), 'admin', 'Admin Name')
ON CONFLICT (id)
DO UPDATE SET role = 'admin';
```

3. Clear browser cache and localStorage, then sign in again

## Future Enhancements

- Add staff role functionality
- Role management UI in admin dashboard
- Granular permissions per role
- Audit logs for role changes