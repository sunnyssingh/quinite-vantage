-- ==============================================================================
-- DATABASE RESET SCRIPT - DELETE ALL DATA (KEEP SCHEMA)
-- ==============================================================================
-- WARNING: This will delete ALL data from your database!
-- Use this to start fresh while keeping the schema intact.
-- ==============================================================================

-- ============================================================================
-- STEP 1: DELETE ALL DATA (in correct order to respect foreign keys)
-- ============================================================================

-- Delete audit logs first (no dependencies)
DELETE FROM public.audit_logs;

-- Delete impersonation sessions
DELETE FROM public.impersonation_sessions;

-- Delete call logs
DELETE FROM public.call_logs;

-- Delete campaigns
DELETE FROM public.campaigns;

-- Delete leads
DELETE FROM public.leads;

-- Delete projects
DELETE FROM public.projects;

-- Delete profiles (this will cascade to related data)
DELETE FROM public.profiles;

-- Delete organizations (this will cascade to related data)
DELETE FROM public.organizations;

-- ============================================================================
-- STEP 2: DELETE AUTH USERS (Supabase auth.users table)
-- ============================================================================

-- Delete all users from auth.users
-- This will also trigger cascade deletes to profiles
DELETE FROM auth.users;

-- ============================================================================
-- STEP 3: RESET SEQUENCES (Optional - resets auto-increment IDs)
-- ============================================================================

-- Note: Your tables use UUIDs, so no sequences to reset
-- If you had any sequences, you would reset them here:
-- ALTER SEQUENCE sequence_name RESTART WITH 1;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that all tables are empty
SELECT 'organizations' as table_name, COUNT(*) as row_count FROM public.organizations
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'projects', COUNT(*) FROM public.projects
UNION ALL
SELECT 'leads', COUNT(*) FROM public.leads
UNION ALL
SELECT 'campaigns', COUNT(*) FROM public.campaigns
UNION ALL
SELECT 'call_logs', COUNT(*) FROM public.call_logs
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM public.audit_logs
UNION ALL
SELECT 'impersonation_sessions', COUNT(*) FROM public.impersonation_sessions
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users;

-- Success message
SELECT '✅ Database reset complete! All data deleted, schema preserved.' as status;
