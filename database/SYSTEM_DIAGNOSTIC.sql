-- ============================================================================
-- COMPLETE SYSTEM DIAGNOSTIC FOR SUPABASE
-- Run this in Supabase SQL Editor to check your database status
-- ============================================================================

-- ============================================================================
-- PART 1: DATABASE STRUCTURE CHECK
-- ============================================================================

SELECT '========================================' as separator;
SELECT '1. CHECKING DATABASE TABLES' as step;
SELECT '========================================' as separator;

-- Check if all required tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'organizations', 'profiles', 'roles', 'features', 
      'role_permissions', 'user_permissions', 'audit_logs',
      'organization_profiles', 'impersonation_sessions'
    ) THEN '✅ Required'
    ELSE '📋 Other'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- PART 2: DATA VERIFICATION
-- ============================================================================

SELECT '========================================' as separator;
SELECT '2. CHECKING DATA COUNTS' as step;
SELECT '========================================' as separator;

-- Count records in each table
SELECT 
  'organizations' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '⚠️ Empty' END as status
FROM organizations
UNION ALL
SELECT 
  'profiles',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '⚠️ Empty' END
FROM profiles
UNION ALL
SELECT 
  'roles',
  COUNT(*),
  CASE WHEN COUNT(*) = 4 THEN '✅ Complete' WHEN COUNT(*) > 0 THEN '⚠️ Missing roles' ELSE '❌ Empty' END
FROM roles
UNION ALL
SELECT 
  'features',
  COUNT(*),
  CASE WHEN COUNT(*) = 15 THEN '✅ Complete' WHEN COUNT(*) > 0 THEN '⚠️ Missing features' ELSE '❌ Empty' END
FROM features
UNION ALL
SELECT 
  'role_permissions',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌ Empty' END
FROM role_permissions
UNION ALL
SELECT 
  'organization_profiles',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '📋 None yet' END
FROM organization_profiles
UNION ALL
SELECT 
  'audit_logs',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '📋 None yet' END
FROM audit_logs;

-- ============================================================================
-- PART 3: ROLES & FEATURES CHECK
-- ============================================================================

SELECT '========================================' as separator;
SELECT '3. CHECKING ROLES' as step;
SELECT '========================================' as separator;

SELECT 
  name,
  is_platform_admin,
  CASE 
    WHEN name = 'Platform Admin' THEN '🛡️ Admin'
    WHEN name = 'Client Super Admin' THEN '👑 Super Admin'
    WHEN name = 'Manager' THEN '📊 Manager'
    WHEN name = 'Employee' THEN '👤 Employee'
    ELSE '❓ Unknown'
  END as role_type
FROM roles
ORDER BY 
  CASE 
    WHEN name = 'Platform Admin' THEN 1
    WHEN name = 'Client Super Admin' THEN 2
    WHEN name = 'Manager' THEN 3
    WHEN name = 'Employee' THEN 4
    ELSE 5
  END;

SELECT '========================================' as separator;
SELECT '4. CHECKING FEATURES BY CATEGORY' as step;
SELECT '========================================' as separator;

SELECT 
  category,
  COUNT(*) as feature_count,
  string_agg(name, ', ' ORDER BY name) as features
FROM features
GROUP BY category
ORDER BY category;

-- ============================================================================
-- PART 4: USER & ORGANIZATION STATUS
-- ============================================================================

SELECT '========================================' as separator;
SELECT '5. CHECKING USERS & ORGANIZATIONS' as step;
SELECT '========================================' as separator;

-- Users overview
SELECT 
  p.email,
  p.full_name,
  r.name as role,
  o.name as organization,
  o.onboarding_status,
  p.is_platform_admin,
  CASE 
    WHEN p.is_platform_admin THEN '🛡️ Platform Admin'
    WHEN o.onboarding_status = 'PENDING' THEN '⏳ Needs Onboarding'
    WHEN o.onboarding_status = 'COMPLETED' THEN '✅ Active'
    WHEN p.organization_id IS NULL THEN '⚠️ No Organization'
    ELSE '❓ Unknown Status'
  END as user_status
FROM profiles p
LEFT JOIN roles r ON p.role_id = r.id
LEFT JOIN organizations o ON p.organization_id = o.id
ORDER BY p.created_at DESC;

-- Organizations overview
SELECT '========================================' as separator;
SELECT '6. ORGANIZATIONS OVERVIEW' as step;
SELECT '========================================' as separator;

SELECT 
  o.name as organization_name,
  o.onboarding_status,
  COUNT(p.id) as user_count,
  op.company_name,
  op.business_type,
  op.sector,
  CASE 
    WHEN o.onboarding_status = 'PENDING' THEN '⏳ Awaiting Onboarding'
    WHEN o.onboarding_status = 'COMPLETED' THEN '✅ Active'
    ELSE '❓ Unknown'
  END as status
FROM organizations o
LEFT JOIN profiles p ON o.id = p.organization_id
LEFT JOIN organization_profiles op ON o.id = op.organization_id
GROUP BY o.id, o.name, o.onboarding_status, op.company_name, op.business_type, op.sector
ORDER BY o.created_at DESC;

-- ============================================================================
-- PART 5: RLS POLICIES CHECK
-- ============================================================================

SELECT '========================================' as separator;
SELECT '7. CHECKING RLS POLICIES' as step;
SELECT '========================================' as separator;

-- Check which tables have RLS enabled
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '⚠️ Disabled' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'organizations', 'profiles', 'roles', 'features',
    'organization_profiles', 'audit_logs', 'impersonation_sessions'
  )
ORDER BY tablename;

-- List all policies
SELECT 
  tablename,
  policyname,
  cmd as command,
  CASE 
    WHEN policyname LIKE '%recursion%' THEN '❌ May cause issues'
    WHEN policyname LIKE '%own%' THEN '✅ Self-access'
    WHEN policyname LIKE '%admin%' THEN '🛡️ Admin access'
    ELSE '📋 Standard'
  END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- PART 6: TRIGGER & FUNCTION CHECK
-- ============================================================================

SELECT '========================================' as separator;
SELECT '8. CHECKING TRIGGERS' as step;
SELECT '========================================' as separator;

SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation as event,
  CASE 
    WHEN trigger_name = 'on_auth_user_created' THEN '✅ Profile Auto-creation'
    ELSE '📋 Other'
  END as purpose
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- ============================================================================
-- PART 7: RECENT ACTIVITY
-- ============================================================================

SELECT '========================================' as separator;
SELECT '9. RECENT AUDIT LOGS (Last 10)' as step;
SELECT '========================================' as separator;

SELECT 
  user_name,
  action,
  entity_type,
  CASE WHEN is_impersonated THEN '🔄 Impersonated' ELSE '👤 Direct' END as action_type,
  created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- PART 8: SPECIFIC USER CHECK (Your User)
-- ============================================================================

SELECT '========================================' as separator;
SELECT '10. YOUR USER STATUS' as step;
SELECT '========================================' as separator;

SELECT 
  p.id,
  p.email,
  p.full_name,
  p.organization_id,
  o.name as org_name,
  o.onboarding_status,
  r.name as role,
  p.is_platform_admin,
  CASE 
    WHEN p.organization_id IS NULL THEN '❌ NO ORGANIZATION - Run onboard API'
    WHEN o.onboarding_status = 'PENDING' THEN '⏳ SHOULD SEE ONBOARDING SCREEN'
    WHEN o.onboarding_status = 'COMPLETED' THEN '✅ SHOULD SEE DASHBOARD'
    ELSE '❓ Unknown state'
  END as expected_behavior,
  p.created_at
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
LEFT JOIN roles r ON p.role_id = r.id
WHERE p.email = 'sunnysingh889014@gmail.com';

-- ============================================================================
-- PART 9: PERMISSION CHECK FOR YOUR USER
-- ============================================================================

SELECT '========================================' as separator;
SELECT '11. YOUR PERMISSIONS' as step;
SELECT '========================================' as separator;

WITH user_role AS (
  SELECT role_id FROM profiles WHERE email = 'sunnysingh889014@gmail.com'
)
SELECT 
  f.category,
  f.name as permission,
  f.description,
  '✅ Granted' as status
FROM role_permissions rp
JOIN features f ON rp.feature_id = f.id
WHERE rp.role_id = (SELECT role_id FROM user_role)
ORDER BY f.category, f.name;

-- ============================================================================
-- PART 10: PROBLEMS DETECTION
-- ============================================================================

SELECT '========================================' as separator;
SELECT '12. POTENTIAL ISSUES DETECTED' as step;
SELECT '========================================' as separator;

-- Check for users without organizations
SELECT 
  '⚠️ Users without organizations' as issue_type,
  COUNT(*) as count,
  string_agg(email, ', ') as affected_users
FROM profiles
WHERE organization_id IS NULL
GROUP BY issue_type
HAVING COUNT(*) > 0

UNION ALL

-- Check for users without roles
SELECT 
  '⚠️ Users without roles' as issue_type,
  COUNT(*),
  string_agg(email, ', ')
FROM profiles
WHERE role_id IS NULL
GROUP BY issue_type
HAVING COUNT(*) > 0

UNION ALL

-- Check for orgs without profiles
SELECT 
  '⚠️ Organizations without business profiles' as issue_type,
  COUNT(*),
  string_agg(o.name, ', ')
FROM organizations o
LEFT JOIN organization_profiles op ON o.id = op.organization_id
WHERE op.id IS NULL AND o.onboarding_status = 'COMPLETED'
GROUP BY issue_type
HAVING COUNT(*) > 0

UNION ALL

-- Check for auth users without profiles
SELECT 
  '❌ Auth users without profiles (CRITICAL)' as issue_type,
  COUNT(*),
  string_agg(u.email, ', ')
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
GROUP BY issue_type
HAVING COUNT(*) > 0;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT '========================================' as separator;
SELECT '✅ DIAGNOSTIC COMPLETE' as summary;
SELECT '========================================' as separator;

DO $$
DECLARE
  table_count INTEGER;
  role_count INTEGER;
  feature_count INTEGER;
  user_count INTEGER;
  org_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name IN (
    'organizations', 'profiles', 'roles', 'features',
    'role_permissions', 'user_permissions', 'audit_logs',
    'organization_profiles', 'impersonation_sessions'
  );
  
  SELECT COUNT(*) INTO role_count FROM roles;
  SELECT COUNT(*) INTO feature_count FROM features;
  SELECT COUNT(*) INTO user_count FROM profiles;
  SELECT COUNT(*) INTO org_count FROM organizations;

  RAISE NOTICE '';
  RAISE NOTICE '=== DATABASE STATUS ===';
  RAISE NOTICE 'Tables: %/9', table_count;
  RAISE NOTICE 'Roles: %/4', role_count;
  RAISE NOTICE 'Features: %/15', feature_count;
  RAISE NOTICE 'Users: %', user_count;
  RAISE NOTICE 'Organizations: %', org_count;
  RAISE NOTICE '';
  
  IF table_count < 9 THEN
    RAISE NOTICE '⚠️  Some tables are missing - Run COMPLETE_MIGRATION.sql';
  ELSIF role_count < 4 THEN
    RAISE NOTICE '⚠️  Some roles are missing - Run COMPLETE_MIGRATION.sql';
  ELSIF feature_count < 15 THEN
    RAISE NOTICE '⚠️  Some features are missing - Run COMPLETE_MIGRATION.sql';
  ELSE
    RAISE NOTICE '✅ Database structure looks good!';
  END IF;
  
  RAISE NOTICE '';
END $$;
