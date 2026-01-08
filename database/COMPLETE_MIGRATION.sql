-- ============================================================================
-- COMPLETE DATABASE MIGRATION FOR MULTI-TENANT SAAS PLATFORM
-- FIXED: Handles existing policies properly
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PART 1: CORE TABLES
-- ============================================================================

-- Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  onboarding_status TEXT DEFAULT 'PENDING' CHECK (onboarding_status IN ('PENDING', 'COMPLETED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add onboarding_status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'onboarding_status'
  ) THEN
    ALTER TABLE organizations 
    ADD COLUMN onboarding_status TEXT DEFAULT 'PENDING' CHECK (onboarding_status IN ('PENDING', 'COMPLETED'));
  END IF;
END $$;

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_platform_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id),
  email TEXT NOT NULL,
  full_name TEXT,
  is_platform_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Features Table
CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role Permissions Table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, feature_id)
);

-- User Permissions Table (overrides)
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, feature_id)
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add impersonation columns to audit_logs if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' AND column_name = 'impersonator_user_id'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN impersonator_user_id UUID REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' AND column_name = 'is_impersonated'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN is_impersonated BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ============================================================================
-- PART 2: PLATFORM vs ORG SEPARATION TABLES
-- ============================================================================

-- Organization Profiles Table (Business Information)
CREATE TABLE IF NOT EXISTS organization_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  
  -- Business Information
  sector TEXT DEFAULT 'real_estate' CHECK (sector IN ('real_estate')),
  business_type TEXT CHECK (business_type IN ('agent', 'builder')),
  company_name TEXT,
  gstin TEXT,
  
  -- Address
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  pincode TEXT,
  
  -- Contact
  contact_number TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Impersonation Sessions Table
CREATE TABLE IF NOT EXISTS impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  impersonator_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  impersonated_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  impersonated_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 3: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_impersonated ON audit_logs(is_impersonated) WHERE is_impersonated = TRUE;
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_org_profiles_org ON organization_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_impersonator ON impersonation_sessions(impersonator_user_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_active ON impersonation_sessions(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- PART 4: INSERT DEFAULT DATA
-- ============================================================================

-- Insert Default Roles
INSERT INTO roles (name, description, is_platform_admin) VALUES
  ('Platform Admin', 'Full platform access across all organizations', TRUE),
  ('Client Super Admin', 'Full access to all features within organization', FALSE),
  ('Manager', 'Management access with analytics', FALSE),
  ('Employee', 'Basic access to projects, campaigns, and leads', FALSE)
ON CONFLICT (name) DO NOTHING;

-- Insert Features
INSERT INTO features (name, description, category) VALUES
  ('project.create', 'Create new projects', 'projects'),
  ('project.edit', 'Edit existing projects', 'projects'),
  ('project.view', 'View projects', 'projects'),
  ('campaign.create', 'Create new campaigns', 'campaigns'),
  ('campaign.edit', 'Edit existing campaigns', 'campaigns'),
  ('campaign.run', 'Run and execute campaigns', 'campaigns'),
  ('campaign.view', 'View campaigns', 'campaigns'),
  ('leads.upload', 'Upload leads', 'leads'),
  ('leads.edit', 'Edit leads', 'leads'),
  ('leads.view', 'View leads', 'leads'),
  ('analytics.view_basic', 'View basic analytics', 'analytics'),
  ('billing.view', 'View billing information', 'billing'),
  ('users.create', 'Create new users', 'users'),
  ('users.edit', 'Edit user permissions', 'users'),
  ('audit.view', 'View audit logs', 'audit')
ON CONFLICT (name) DO NOTHING;

-- Assign Default Role Permissions
-- Client Super Admin: All features
INSERT INTO role_permissions (role_id, feature_id)
SELECT r.id, f.id
FROM roles r
CROSS JOIN features f
WHERE r.name = 'Client Super Admin'
ON CONFLICT (role_id, feature_id) DO NOTHING;

-- Manager: Employee permissions + analytics
INSERT INTO role_permissions (role_id, feature_id)
SELECT r.id, f.id
FROM roles r
CROSS JOIN features f
WHERE r.name = 'Manager'
  AND f.name IN (
    'project.view', 'project.edit', 'project.create',
    'campaign.view', 'campaign.edit', 'campaign.create', 'campaign.run',
    'leads.view', 'leads.edit', 'leads.upload',
    'analytics.view_basic'
  )
ON CONFLICT (role_id, feature_id) DO NOTHING;

-- Employee: Basic access
INSERT INTO role_permissions (role_id, feature_id)
SELECT r.id, f.id
FROM roles r
CROSS JOIN features f
WHERE r.name = 'Employee'
  AND f.name IN (
    'project.view',
    'campaign.view',
    'leads.view'
  )
ON CONFLICT (role_id, feature_id) DO NOTHING;

-- ============================================================================
-- PART 5: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on these tables
DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- Drop policies on organizations
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organizations') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON organizations';
  END LOOP;

  -- Drop policies on profiles
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
  END LOOP;

  -- Drop policies on audit_logs
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'audit_logs') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON audit_logs';
  END LOOP;

  -- Drop policies on organization_profiles
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organization_profiles') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON organization_profiles';
  END LOOP;

  -- Drop policies on impersonation_sessions
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'impersonation_sessions') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON impersonation_sessions';
  END LOOP;
END $$;

-- Create new policies
-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE organization_id = organizations.id
    )
  );

-- Profiles: Users can view profiles in their organization
CREATE POLICY "Users can view profiles in their organization"
  ON profiles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    OR is_platform_admin = TRUE
  );

-- Audit Logs: Users can view logs in their organization
CREATE POLICY "Users can view audit logs in their organization"
  ON audit_logs FOR SELECT
  USING (
    user_id IN (
      SELECT p1.id FROM profiles p1
      JOIN profiles p2 ON p1.organization_id = p2.organization_id
      WHERE p2.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = TRUE
    )
  );

-- Organization Profiles: Users can view their org profile
CREATE POLICY "Users can view their org profile"
  ON organization_profiles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = TRUE
    )
  );

-- Organization Profiles: Platform admins can manage all
CREATE POLICY "Platform admins can manage all org profiles"
  ON organization_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = TRUE
    )
  );

-- Impersonation Sessions: Platform admins only
CREATE POLICY "Platform admins can view impersonation sessions"
  ON impersonation_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = TRUE
    )
  );

CREATE POLICY "Platform admins can create impersonation sessions"
  ON impersonation_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = TRUE
    )
  );

-- ============================================================================
-- PART 6: FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PART 7: GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- PART 8: COMMENTS (DOCUMENTATION)
-- ============================================================================

COMMENT ON TABLE organizations IS 'Organizations/companies in the platform';
COMMENT ON TABLE organization_profiles IS 'Business profile information for organizations';
COMMENT ON TABLE impersonation_sessions IS 'Tracks when platform admins impersonate org users';
COMMENT ON COLUMN organizations.onboarding_status IS 'PENDING: needs onboarding, COMPLETED: ready to use';
COMMENT ON COLUMN organization_profiles.sector IS 'Currently only real_estate is enabled';
COMMENT ON COLUMN organization_profiles.business_type IS 'agent or builder for real estate sector';
COMMENT ON COLUMN audit_logs.is_impersonated IS 'TRUE if action was performed during impersonation';

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify)
-- ============================================================================

-- Verify tables created
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Verifying Tables ===';
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organizations') THEN
    RAISE NOTICE '✓ organizations table exists';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    RAISE NOTICE '✓ profiles table exists';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'roles') THEN
    RAISE NOTICE '✓ roles table exists';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'features') THEN
    RAISE NOTICE '✓ features table exists';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organization_profiles') THEN
    RAISE NOTICE '✓ organization_profiles table exists';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'impersonation_sessions') THEN
    RAISE NOTICE '✓ impersonation_sessions table exists';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
    RAISE NOTICE '✓ audit_logs table exists';
  END IF;
END $$;

-- Check roles inserted
DO $$
DECLARE
  role_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO role_count FROM roles;
  RAISE NOTICE '';
  RAISE NOTICE '=== Data Verification ===';
  RAISE NOTICE 'Roles Count: %', role_count;
END $$;

-- List roles
SELECT name FROM roles ORDER BY name;

-- Check features inserted
DO $$
DECLARE
  feature_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO feature_count FROM features;
  RAISE NOTICE 'Features Count: %', feature_count;
END $$;

-- Check role permissions
DO $$
DECLARE
  perm_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO perm_count FROM role_permissions;
  RAISE NOTICE 'Role Permissions Count: %', perm_count;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ DATABASE MIGRATION COMPLETED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. All tables and policies created successfully';
  RAISE NOTICE '2. Create a platform admin user manually:';
  RAISE NOTICE '   UPDATE profiles SET is_platform_admin = TRUE WHERE email = ''your-admin@email.com'';';
  RAISE NOTICE '3. Test signup flow at your app URL';
  RAISE NOTICE '4. Complete onboarding wizard';
  RAISE NOTICE '';
END $$;
