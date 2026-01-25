-- Comprehensive RLS Policy Fix with RBAC support
-- Run this in your Supabase SQL Editor.

-- ==============================================================================
-- 0. HELPER FUNCTIONS (Idempotent)
-- ==============================================================================
DROP FUNCTION IF EXISTS get_auth_org_id();
CREATE OR REPLACE FUNCTION get_auth_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

DROP FUNCTION IF EXISTS get_auth_role();
CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role::TEXT FROM profiles WHERE id = auth.uid();
$$;

-- ==============================================================================
-- 1. PROJECTS
-- ==============================================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "view_org_projects" ON projects;
CREATE POLICY "view_org_projects" ON projects
FOR SELECT USING (
  organization_id = get_auth_org_id()
);

DROP POLICY IF EXISTS "manage_org_projects" ON projects;
CREATE POLICY "manage_org_projects" ON projects
FOR ALL USING (
  organization_id = get_auth_org_id()
  -- Explicitly allow all roles for now, can restrict later:
  -- AND get_auth_role() IN ('super_admin', 'manager')
);

-- ==============================================================================
-- 2. CAMPAIGNS
-- ==============================================================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "view_org_campaigns" ON campaigns;
CREATE POLICY "view_org_campaigns" ON campaigns
FOR SELECT USING (
  organization_id = get_auth_org_id()
);

DROP POLICY IF EXISTS "manage_org_campaigns" ON campaigns;
CREATE POLICY "manage_org_campaigns" ON campaigns
FOR ALL USING (
  organization_id = get_auth_org_id()
);

-- ==============================================================================
-- 3. LEADS
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads') THEN
        ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "view_org_leads" ON leads;
        EXECUTE 'CREATE POLICY "view_org_leads" ON leads FOR SELECT USING (organization_id = get_auth_org_id())';
        
        DROP POLICY IF EXISTS "manage_org_leads" ON leads;
        EXECUTE 'CREATE POLICY "manage_org_leads" ON leads FOR ALL USING (organization_id = get_auth_org_id())';
    END IF;
END $$;

-- ==============================================================================
-- 4. CALL LOGS
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'call_logs') THEN
        ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "view_org_call_logs" ON call_logs;
        EXECUTE 'CREATE POLICY "view_org_call_logs" ON call_logs FOR SELECT USING (organization_id = get_auth_org_id())';

        -- Usually call logs are created by system or employees
        DROP POLICY IF EXISTS "manage_org_call_logs" ON call_logs;
        EXECUTE 'CREATE POLICY "manage_org_call_logs" ON call_logs FOR ALL USING (organization_id = get_auth_org_id())';
    END IF;
END $$;
