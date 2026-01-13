-- ============================================
-- DATABASE RESET SCRIPT - USER DATA ONLY
-- ⚠️ WARNING: This will DELETE ALL USER DATA
-- ✅ PRESERVES: roles, role_permissions (system configuration)
-- Use this ONLY for testing/development
-- ============================================

-- Disable RLS temporarily to allow deletion
ALTER TABLE IF EXISTS public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.call_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organization_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.impersonation_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_permissions DISABLE ROW LEVEL SECURITY;

-- Delete USER DATA ONLY (order matters due to foreign keys)
-- Delete dependent tables first
DELETE FROM public.impersonation_sessions;
DELETE FROM public.audit_logs;
DELETE FROM public.call_logs;
DELETE FROM public.leads;
DELETE FROM public.campaigns;
DELETE FROM public.projects;
DELETE FROM public.user_permissions;
DELETE FROM public.profiles;
DELETE FROM public.organization_profiles;
DELETE FROM public.organizations;

-- ⚠️ DO NOT DELETE SYSTEM CONFIGURATION TABLES:
-- - roles (Manager, Employee, Platform Admin, Client Super Admin)
-- - role_permissions (mapping of roles to permissions)
-- - features (if exists)

-- Re-enable RLS
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.impersonation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Delete all auth users (Supabase Auth)
-- Note: This requires service_role key or admin access
-- Run this separately in Supabase Dashboard if needed
-- You can also use the Supabase Dashboard > Authentication > Users > Delete all

-- Verify deletion (USER DATA - should all be 0)
SELECT 'Organizations' as table_name, COUNT(*) as count FROM public.organizations
UNION ALL
SELECT 'Organization Profiles', COUNT(*) FROM public.organization_profiles
UNION ALL
SELECT 'Profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'Projects', COUNT(*) FROM public.projects
UNION ALL
SELECT 'Campaigns', COUNT(*) FROM public.campaigns
UNION ALL
SELECT 'Leads', COUNT(*) FROM public.leads
UNION ALL
SELECT 'Call Logs', COUNT(*) FROM public.call_logs
UNION ALL
SELECT 'Audit Logs', COUNT(*) FROM public.audit_logs
UNION ALL
SELECT 'Impersonation Sessions', COUNT(*) FROM public.impersonation_sessions
UNION ALL
SELECT 'User Permissions', COUNT(*) FROM public.user_permissions;

-- Verify SYSTEM DATA is preserved (should have data)
SELECT '--- SYSTEM DATA (PRESERVED) ---' as info
UNION ALL
SELECT 'Roles: ' || COUNT(*)::text FROM public.roles
UNION ALL
SELECT 'Role Permissions: ' || COUNT(*)::text FROM public.role_permissions;

-- ============================================
-- USER DATA DELETED - SYSTEM CONFIG PRESERVED
-- Expected: 4 Roles preserved
-- ============================================
