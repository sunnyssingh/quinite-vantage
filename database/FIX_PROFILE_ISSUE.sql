-- ============================================================================
-- EMERGENCY FIX FOR PROFILE ISSUES
-- Run this if profiles are not showing up
-- ============================================================================

-- Step 1: Check if profiles exist for auth users
SELECT 
  u.id,
  u.email,
  u.created_at as user_created,
  p.id as profile_id,
  p.organization_id,
  CASE WHEN p.id IS NULL THEN '❌ MISSING PROFILE' ELSE '✅ Has Profile' END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 20;

-- Step 2: Create missing profiles (for users without profiles)
INSERT INTO profiles (id, email, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 3: Verify RLS policies are not blocking self-reads
-- Add policy to allow users to read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
  );

-- Step 4: Verify trigger is working
-- Check if trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- If trigger is missing, recreate it
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Fix your specific user
-- Replace with your actual user ID
DO $$
DECLARE
  user_id UUID := '4f15480a-edd9-408b-9232-80060bb4f0bb';
  user_email TEXT := 'sunnysingh889014@gmail.com';
BEGIN
  -- Create profile if missing
  INSERT INTO profiles (id, email, created_at, updated_at)
  VALUES (user_id, user_email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE '✓ Profile created/verified for user: %', user_email;
END $$;

-- Step 6: Verify the fix
SELECT 
  p.id,
  p.email,
  p.organization_id,
  p.role_id,
  o.name as org_name,
  o.onboarding_status,
  r.name as role_name
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
LEFT JOIN roles r ON p.role_id = r.id
WHERE p.id = '4f15480a-edd9-408b-9232-80060bb4f0bb';

-- Step 7: If organization is missing, check onboard table
SELECT 
  id,
  name,
  onboarding_status,
  created_at
FROM organizations
ORDER BY created_at DESC
LIMIT 5;

-- Step 8: Link profile to organization if onboard was run but link is missing
-- (Only if you see an org exists but profile.organization_id is NULL)
/*
UPDATE profiles
SET organization_id = (
  SELECT id FROM organizations 
  WHERE created_at = (
    SELECT MAX(created_at) FROM organizations
  )
)
WHERE id = '4f15480a-edd9-408b-9232-80060bb4f0bb'
AND organization_id IS NULL;
*/

-- Step 9: Set role to Client Super Admin if missing
/*
UPDATE profiles
SET role_id = (SELECT id FROM roles WHERE name = 'Client Super Admin')
WHERE id = '4f15480a-edd9-408b-9232-80060bb4f0bb'
AND role_id IS NULL;
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== VERIFICATION COMPLETE ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Check the query results above';
  RAISE NOTICE '2. Refresh /debug page in your browser';
  RAISE NOTICE '3. Logout and login again';
  RAISE NOTICE '4. Should redirect to /onboarding if status is PENDING';
  RAISE NOTICE '';
END $$;
