-- Platform vs Organization Separation - Database Schema Updates
-- Run this SQL in your Supabase SQL Editor AFTER running the initial schema.sql

-- 1. Add onboarding_status to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'PENDING' CHECK (onboarding_status IN ('PENDING', 'COMPLETED'));

-- 2. Create organization_profiles table
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

-- 3. Create impersonation_sessions table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_org_profiles_org ON organization_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_impersonator ON impersonation_sessions(impersonator_user_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_active ON impersonation_sessions(is_active) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE organization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_profiles
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

CREATE POLICY "Platform admins can manage all org profiles"
  ON organization_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = TRUE
    )
  );

-- RLS Policies for impersonation_sessions
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

-- Grant permissions
GRANT ALL ON organization_profiles TO authenticated;
GRANT ALL ON impersonation_sessions TO authenticated;

-- Update audit_logs to track impersonation
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS impersonator_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_impersonated BOOLEAN DEFAULT FALSE;

-- Add index for impersonated actions
CREATE INDEX IF NOT EXISTS idx_audit_impersonated ON audit_logs(is_impersonated) WHERE is_impersonated = TRUE;

-- Comments for documentation
COMMENT ON TABLE organization_profiles IS 'Business profile information for organizations';
COMMENT ON TABLE impersonation_sessions IS 'Tracks when platform admins impersonate org users';
COMMENT ON COLUMN organizations.onboarding_status IS 'PENDING: needs onboarding, COMPLETED: ready to use';
COMMENT ON COLUMN organization_profiles.sector IS 'Currently only real_estate is enabled';
COMMENT ON COLUMN organization_profiles.business_type IS 'agent or builder';
