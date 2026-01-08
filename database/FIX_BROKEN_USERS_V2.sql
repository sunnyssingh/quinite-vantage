-- ================================================================
-- FIXED VERSION - FIX BROKEN USERS - Manual Repair Script
-- ================================================================
-- This script fixes users who have auth.users and profiles records
-- but are missing organization_id and role_id
-- 
-- RUN THIS SCRIPT USING THE SUPABASE SQL EDITOR
-- ================================================================

-- Step 1: Identify broken users (just for viewing)
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.organization_id,
    p.role_id,
    p.created_at
FROM profiles p
WHERE p.organization_id IS NULL 
  AND p.is_platform_admin = false
ORDER BY p.created_at;

-- ================================================================
-- AUTOMATED FIX: Creates organizations and links users
-- ================================================================

DO $$
DECLARE
    broken_user RECORD;
    new_org_id UUID;
    super_admin_role_id UUID;
BEGIN
    -- Get the Client Super Admin role ID
    SELECT id INTO super_admin_role_id 
    FROM roles 
    WHERE name = 'Client Super Admin' 
    LIMIT 1;

    IF super_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Client Super Admin role not found!';
    END IF;

    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Starting broken user fix process...';
    RAISE NOTICE '==========================================';

    -- Loop through all broken users
    FOR broken_user IN 
        SELECT id, email, full_name 
        FROM profiles 
        WHERE organization_id IS NULL 
          AND is_platform_admin = false
    LOOP
        RAISE NOTICE '';
        RAISE NOTICE 'Fixing user: % (ID: %)', broken_user.email, broken_user.id;

        -- Create a new organization for this user
        INSERT INTO organizations (name, onboarding_status)
        VALUES (
            COALESCE(broken_user.full_name, SPLIT_PART(broken_user.email, '@', 1)) || '''s Organization',
            'PENDING'
        )
        RETURNING id INTO new_org_id;

        RAISE NOTICE '  -> Created organization: %', new_org_id;

        -- Create organization profile with default values
        INSERT INTO organization_profiles (
            organization_id,
            sector,
            country
        ) VALUES (
            new_org_id,
            'real_estate',
            'India'
        );

        RAISE NOTICE '  -> Created organization profile';

        -- Update the user's profile
        UPDATE profiles
        SET 
            organization_id = new_org_id,
            role_id = super_admin_role_id
        WHERE id = broken_user.id;

        RAISE NOTICE '  -> Updated user profile';

        -- Create audit log entry
        INSERT INTO audit_logs (
            user_id,
            user_name,
            action,
            entity_type,
            entity_id,
            metadata
        ) VALUES (
            broken_user.id,
            COALESCE(broken_user.full_name, broken_user.email),
            'ORG_CREATED',
            'organization',
            new_org_id::TEXT,
            jsonb_build_object(
                'reason', 'manual_fix_for_broken_signup',
                'organization_id', new_org_id,
                'organization_name', COALESCE(broken_user.full_name, SPLIT_PART(broken_user.email, '@', 1)) || '''s Organization'
            )
        );

        RAISE NOTICE '  -> Created audit log entry';
        RAISE NOTICE 'SUCCESS! User % is now linked to org %', broken_user.email, new_org_id;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'All broken users have been fixed!';
    RAISE NOTICE '==========================================';
END $$;

-- ================================================================
-- Verification: Check that all users now have organizations
-- ================================================================

SELECT 
    COUNT(*) as total_non_admin_users,
    COUNT(organization_id) as users_with_organization,
    COUNT(*) - COUNT(organization_id) as still_broken
FROM profiles
WHERE is_platform_admin = false;

-- ================================================================
-- View the fixed users with full details
-- ================================================================

SELECT 
    p.email,
    p.full_name,
    o.name as organization_name,
    o.id as organization_id,
    r.name as role_name,
    o.onboarding_status,
    p.created_at as user_created_at
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
LEFT JOIN roles r ON p.role_id = r.id
WHERE p.is_platform_admin = false
ORDER BY p.created_at DESC;
