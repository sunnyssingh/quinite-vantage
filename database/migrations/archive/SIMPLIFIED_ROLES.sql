-- ==============================================================================
-- SIMPLIFIED ROLE-BASED ARCHITECTURE MIGRATION (SAFE VERSION)
-- Works with existing schema from COMPLETE_SCHEMA.sql
-- ==============================================================================

-- ============================================================================
-- PART 1: CREATE NEW ROLE ENUM
-- ============================================================================

-- Create the new simple role enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
      'platform_admin',
      'super_admin',
      'manager',
      'employee'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PART 2: UPDATE PROFILES TABLE
-- ============================================================================

-- Add new role column
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'employee';

-- Add manager hierarchy
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id);

-- ============================================================================
-- PART 3: MIGRATE EXISTING DATA
-- ============================================================================

-- Set first user in each org as super_admin
WITH first_users AS (
  SELECT DISTINCT ON (organization_id) 
    id,
    organization_id
  FROM public.profiles
  WHERE organization_id IS NOT NULL
  ORDER BY organization_id, created_at ASC
)
UPDATE public.profiles
SET role = 'super_admin'
WHERE id IN (SELECT id FROM first_users);

-- ============================================================================
-- PART 4: DROP OLD COLUMNS (after data migration)
-- ============================================================================

-- Drop old role_id column
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS role_id;

-- Drop old system_role column  
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS system_role;

-- ============================================================================
-- PART 5: DROP OLD TABLES
-- ============================================================================

-- Drop old roles table (no longer needed)
DROP TABLE IF EXISTS public.roles CASCADE;

-- Drop features table if it exists
DROP TABLE IF EXISTS public.features CASCADE;

-- Drop permission tables if they exist
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.user_permissions CASCADE;

-- Drop old enum
DROP TYPE IF EXISTS public.system_role_enum CASCADE;

-- ============================================================================
-- PART 6: UPDATE RLS POLICIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "View org profiles" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage profiles" ON public.profiles;

-- Create new simplified policies
CREATE POLICY "Users can view org profiles" ON public.profiles
    FOR SELECT USING (organization_id = get_auth_org_id());

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Super admins can manage profiles" ON public.profiles
    FOR ALL USING (
        organization_id = get_auth_org_id() 
        AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    );

-- ============================================================================
-- PART 7: UPDATE HELPER FUNCTIONS
-- ============================================================================

-- Drop old functions
DROP FUNCTION IF EXISTS public.auth_has_permission CASCADE;
DROP FUNCTION IF EXISTS public.get_auth_role_id CASCADE;
DROP FUNCTION IF EXISTS public.get_auth_system_role CASCADE;

-- Create new simple role getter
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================================
-- PART 8: VERIFICATION
-- ============================================================================

-- Check role distribution
SELECT 
  'Role Distribution:' as info,
  role,
  COUNT(*) as user_count
FROM public.profiles
GROUP BY role
ORDER BY user_count DESC;

-- Check super admins
SELECT 
  'Super Admins:' as info,
  p.email,
  p.role,
  o.name as organization
FROM public.profiles p
LEFT JOIN public.organizations o ON p.organization_id = o.id
WHERE p.role = 'super_admin';

-- Success message
SELECT '✅ Migration completed successfully! Simplified role system is now active.' as status;
