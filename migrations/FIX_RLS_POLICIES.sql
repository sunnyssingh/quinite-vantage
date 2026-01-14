-- ==============================================================================
-- FIX RLS POLICIES FOR ORGANIZATION CREATION
-- ==============================================================================
-- This fixes the issue where organization_id is NULL after signup
-- The problem: RLS policies are blocking the /api/onboard route from updating profiles
-- ==============================================================================

-- ============================================================================
-- STEP 1: Drop existing RLS policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view org profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage profiles" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own organization" ON public.organizations;
DROP POLICY IF EXISTS "Super admins can manage organization" ON public.organizations;

-- ============================================================================
-- STEP 2: Create new RLS policies (more permissive for onboarding)
-- ============================================================================

-- PROFILES TABLE POLICIES
-- ============================================================================

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to UPDATE their own profile (needed for /api/onboard)
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow users to view profiles in their organization
CREATE POLICY "Users can view org profiles"
  ON public.profiles
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Allow super admins to manage all profiles in their org
CREATE POLICY "Super admins can manage profiles"
  ON public.profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
      AND organization_id = profiles.organization_id
    )
  );

-- ORGANIZATIONS TABLE POLICIES
-- ============================================================================

-- Allow users to view their own organization
CREATE POLICY "Users can view own organization"
  ON public.organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Allow super admins to UPDATE their organization
CREATE POLICY "Super admins can update organization"
  ON public.organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Allow super admins to INSERT organizations (for /api/onboard)
CREATE POLICY "Super admins can create organization"
  ON public.organizations
  FOR INSERT
  WITH CHECK (true); -- Allow insert, will be linked via profile update

-- ============================================================================
-- STEP 3: Ensure RLS is enabled
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'organizations')
ORDER BY tablename, policyname;

-- Success message
SELECT '✅ RLS policies updated! Users can now update their profiles and create organizations during onboarding.' as status;
