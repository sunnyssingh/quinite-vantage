-- =====================================================
-- Organization Profiles Table
-- =====================================================
-- This table stores detailed business information for each organization
-- collected during the onboarding process.

CREATE TABLE IF NOT EXISTS organization_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Business Information
  sector TEXT NOT NULL DEFAULT 'real_estate',
  business_type TEXT, -- 'agent', 'builder', etc.
  company_name TEXT,
  gstin TEXT,
  contact_number TEXT,
  
  -- Address
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  pincode TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_org_profiles_org_id ON organization_profiles(organization_id);

-- =====================================================
-- Row Level Security Policies
-- =====================================================
ALTER TABLE organization_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own organization's profile
CREATE POLICY "Users can view own org profile"
  ON organization_profiles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Platform admins can view all organization profiles
CREATE POLICY "Platform admins can view all org profiles"
  ON organization_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_platform_admin = TRUE
    )
  );

-- =====================================================
-- Additional Performance Indexes
-- =====================================================
-- Add indexes to existing tables for better performance

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Projects indexes (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(organization_id);
    CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
  END IF;
END $$;

-- Campaigns indexes (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    CREATE INDEX IF NOT EXISTS idx_campaigns_project_id ON campaigns(project_id);
    CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
    CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON campaigns(scheduled_at);
  END IF;
END $$;
