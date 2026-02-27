-- ============================================================
-- Seed: Create initial admin user
-- ============================================================
-- NOTE: Run this AFTER creating the admin user in Supabase Auth.
-- Replace the UUID and email below with the actual auth user's values.
--
-- Example:
-- 1. Go to Supabase Dashboard → Authentication → Users → "Add user"
-- 2. Create user with email: admin@restpos.com, password: YourSecurePassword
-- 3. Copy the generated UUID
-- 4. Update the INSERT below and run it in SQL Editor

INSERT INTO public.users (id, email, full_name, role, restaurant_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000000',  -- Replace with actual auth.users.id
  'admin@restpos.com',                      -- Replace with actual email
  'System Admin',
  'admin',
  NULL,
  true
);
