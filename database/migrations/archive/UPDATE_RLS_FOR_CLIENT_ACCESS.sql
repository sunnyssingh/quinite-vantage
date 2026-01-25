-- ==============================================================================
-- FIX RLS POLICIES - SECURE CLIENT-SIDE ACCESS
-- ==============================================================================
-- This updates RLS policies to allow secure client-side access while
-- maintaining proper security boundaries
-- ==============================================================================

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view org profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage profiles" ON public.profiles;

-- Allow users to SELECT their own profile (needed for dashboard)
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to UPDATE their own profile (needed for onboarding)
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

-- ============================================================================
-- ORGANIZATIONS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own organization" ON public.organizations;
DROP POLICY IF EXISTS "Super admins can update organization" ON public.organizations;
DROP POLICY IF EXISTS "Allow organization creation" ON public.organizations;

-- Allow users to SELECT their own organization (needed for dashboard)
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

-- Allow INSERT for onboarding (critical for signup)
CREATE POLICY "Allow organization creation"
  ON public.organizations
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check profiles policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Check organizations policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'organizations'
ORDER BY policyname;

SELECT '✅ RLS policies updated for secure client-side access!' as status;
