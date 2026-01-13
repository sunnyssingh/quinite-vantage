-- ============================================
-- COMPREHENSIVE ROW LEVEL SECURITY (RLS) POLICIES
-- Quinite Vantage - AI Calling Platform
-- Version: 2.0.0 - MULTI-TENANCY FIX
-- ============================================
-- This file contains ALL RLS policies for complete data isolation
-- CRITICAL: This fixes the multi-tenancy security breach
-- ============================================

-- ============================================
-- 1. PROJECTS TABLE RLS
-- ============================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can delete projects in their organization" ON public.projects;

-- SELECT Policy
CREATE POLICY "Users can view projects in their organization"
  ON public.projects
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy
CREATE POLICY "Users can create projects in their organization"
  ON public.projects
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy
CREATE POLICY "Users can update projects in their organization"
  ON public.projects
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- DELETE Policy
CREATE POLICY "Users can delete projects in their organization"
  ON public.projects
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- 2. CAMPAIGNS TABLE RLS
-- ============================================

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view campaigns in their organization" ON public.campaigns;
DROP POLICY IF EXISTS "Users can create campaigns in their organization" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update campaigns in their organization" ON public.campaigns;
DROP POLICY IF EXISTS "Users can delete campaigns in their organization" ON public.campaigns;

-- SELECT Policy
CREATE POLICY "Users can view campaigns in their organization"
  ON public.campaigns
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy
CREATE POLICY "Users can create campaigns in their organization"
  ON public.campaigns
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy
CREATE POLICY "Users can update campaigns in their organization"
  ON public.campaigns
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- DELETE Policy
CREATE POLICY "Users can delete campaigns in their organization"
  ON public.campaigns
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- 3. LEADS TABLE RLS (EXISTING - KEEP)
-- ============================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view leads in their organization" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads in their organization" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads in their organization" ON public.leads;
DROP POLICY IF EXISTS "Users can delete leads in their organization" ON public.leads;

-- SELECT Policy
CREATE POLICY "Users can view leads in their organization"
  ON public.leads
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy
CREATE POLICY "Users can create leads in their organization"
  ON public.leads
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy
CREATE POLICY "Users can update leads in their organization"
  ON public.leads
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- DELETE Policy
CREATE POLICY "Users can delete leads in their organization"
  ON public.leads
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- 4. CALL_LOGS TABLE RLS (EXISTING - KEEP)
-- ============================================

ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view call logs in their organization" ON public.call_logs;
DROP POLICY IF EXISTS "Users can create call logs in their organization" ON public.call_logs;
DROP POLICY IF EXISTS "Users can update call logs in their organization" ON public.call_logs;

-- SELECT Policy
CREATE POLICY "Users can view call logs in their organization"
  ON public.call_logs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy
CREATE POLICY "Users can create call logs in their organization"
  ON public.call_logs
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy
CREATE POLICY "Users can update call logs in their organization"
  ON public.call_logs
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- 5. PROFILES TABLE RLS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

-- Users can view other profiles in their organization
CREATE POLICY "Users can view profiles in their organization"
  ON public.profiles
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid());

-- ============================================
-- 6. ORGANIZATIONS TABLE RLS
-- ============================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can update their own organization" ON public.organizations;

-- Users can view their own organization
CREATE POLICY "Users can view their own organization"
  ON public.organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Users can update their own organization (admins only - handled by permissions)
CREATE POLICY "Users can update their own organization"
  ON public.organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- 7. AUDIT_LOGS TABLE RLS
-- ============================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view audit logs in their organization" ON public.audit_logs;

-- SELECT Policy
CREATE POLICY "Users can view audit logs in their organization"
  ON public.audit_logs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- 8. VERIFICATION
-- ============================================

-- List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('projects', 'campaigns', 'leads', 'call_logs', 'profiles', 'organizations', 'audit_logs')
ORDER BY tablename, policyname;

-- Verify RLS is enabled on all tables
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'campaigns', 'leads', 'call_logs', 'profiles', 'organizations', 'audit_logs');

-- ============================================
-- RLS POLICIES COMPLETE - MULTI-TENANCY SECURED
-- ============================================
