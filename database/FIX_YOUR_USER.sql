-- ============================================================================
-- FIX FOR USERS WITHOUT ORGANIZATIONS
-- Specifically for: sunnysingh889014@gmail.com
-- ============================================================================

-- This fixes users who signed up but never got linked to an organization

DO $$
DECLARE
  target_user_id UUID := '4f15480a-edd9-408b-9232-80060bb4f0bb';
  target_email TEXT := 'sunnysingh889014@gmail.com';
  new_org_id UUID;
  super_admin_role_id UUID;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixing user: %', target_email;
  RAISE NOTICE '========================================';

  -- Get Client Super Admin role
  SELECT id INTO super_admin_role_id 
  FROM roles 
  WHERE name = 'Client Super Admin' 
  LIMIT 1;

  -- Check if user already has an organization
  SELECT organization_id INTO new_org_id
  FROM profiles
  WHERE id = target_user_id;

  IF new_org_id IS NULL THEN
    -- Create new organization for this user
    INSERT INTO organizations (name, onboarding_status)
    VALUES ('Sunny Singh Org', 'PENDING')
    RETURNING id INTO new_org_id;
    
    RAISE NOTICE '✅ Created organization: %', new_org_id;

    -- Create organization profile
    INSERT INTO organization_profiles (organization_id, sector, country)
    VALUES (new_org_id, 'real_estate', 'India');
    
    RAISE NOTICE '✅ Created organization profile';
  ELSE
    RAISE NOTICE 'ℹ️ User already has organization: %', new_org_id;
  END IF;

  -- Update user profile with org and role
  UPDATE profiles
  SET 
    organization_id = new_org_id,
    role_id = super_admin_role_id,
    full_name = COALESCE(full_name, 'Sunny Singh')
  WHERE id = target_user_id;
  
  RAISE NOTICE '✅ Updated user profile';

  -- Create audit log
  INSERT INTO audit_logs (
    user_id, 
    user_name, 
    action, 
    entity_type, 
    entity_id,
    metadata
  )
  VALUES (
    target_user_id,
    'Sunny Singh',
    'ORG_LINKED',
    'organization',
    new_org_id::TEXT,
    jsonb_build_object('fixed_manually', true)
  );
  
  RAISE NOTICE '✅ Created audit log';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ FIX COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Organization ID: %', new_org_id;
  RAISE NOTICE 'Role: Client Super Admin';
  RAISE NOTICE 'Onboarding Status: PENDING';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Logout from the app';
  RAISE NOTICE '2. Login again';
  RAISE NOTICE '3. Should redirect to /onboarding';
  RAISE NOTICE '';
END $$;

-- Verify the fix
SELECT 
  '========================================' as separator,
  'VERIFICATION' as step,
  '========================================' as separator2;

SELECT 
  p.email,
  p.full_name,
  o.name as organization,
  o.onboarding_status,
  r.name as role,
  CASE 
    WHEN o.onboarding_status = 'PENDING' THEN '✅ SHOULD SEE ONBOARDING'
    WHEN o.onboarding_status = 'COMPLETED' THEN '✅ SHOULD SEE DASHBOARD'
    ELSE '❌ Still broken'
  END as status
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
LEFT JOIN roles r ON p.role_id = r.id
WHERE p.email = 'sunnysingh889014@gmail.com';

-- ============================================================================
-- BONUS: Fix all other users without organizations
-- ============================================================================

-- Uncomment this section to fix ALL users with same issue:

/*
DO $$
DECLARE
  user_record RECORD;
  new_org_id UUID;
  super_admin_role_id UUID;
BEGIN
  -- Get Client Super Admin role
  SELECT id INTO super_admin_role_id 
  FROM roles 
  WHERE name = 'Client Super Admin';

  -- Loop through all users without organizations
  FOR user_record IN 
    SELECT id, email, full_name 
    FROM profiles 
    WHERE organization_id IS NULL
  LOOP
    RAISE NOTICE 'Fixing user: %', user_record.email;
    
    -- Create organization
    INSERT INTO organizations (name, onboarding_status)
    VALUES (
      COALESCE(user_record.full_name, user_record.email) || '''s Organization',
      'PENDING'
    )
    RETURNING id INTO new_org_id;
    
    -- Create org profile
    INSERT INTO organization_profiles (organization_id, sector, country)
    VALUES (new_org_id, 'real_estate', 'India');
    
    -- Update user
    UPDATE profiles
    SET 
      organization_id = new_org_id,
      role_id = super_admin_role_id
    WHERE id = user_record.id;
    
    -- Audit log
    INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id)
    VALUES (user_record.id, COALESCE(user_record.full_name, user_record.email), 
            'ORG_LINKED', 'organization', new_org_id::TEXT);
    
    RAISE NOTICE '✅ Fixed: % -> Org: %', user_record.email, new_org_id;
  END LOOP;
  
  RAISE NOTICE 'All users fixed!';
END $$;
*/
