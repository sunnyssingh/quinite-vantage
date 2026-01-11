-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Quinite Vantage - AI Calling Platform
-- Version: 1.0.0
-- ============================================
-- This file contains all RLS policies for data isolation
-- Run this AFTER the master schema migration
-- ============================================

-- ============================================
-- 1. LEADS TABLE RLS
-- ============================================

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
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
-- 2. CALL_LOGS TABLE RLS
-- ============================================

-- Enable RLS
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view call logs in their organization" ON public.call_logs;
DROP POLICY IF EXISTS "Users can create call logs in their organization" ON public.call_logs;

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

-- INSERT Policy (for system/service role)
CREATE POLICY "Users can create call logs in their organization"
  ON public.call_logs
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- 3. VERIFICATION
-- ============================================

-- List all RLS policies
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
WHERE tablename IN ('leads', 'call_logs')
ORDER BY tablename, policyname;

-- ============================================
-- RLS POLICIES COMPLETE
-- ============================================
