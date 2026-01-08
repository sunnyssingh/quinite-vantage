-- Multi-Tenant SaaS Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);

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

-- Row Level Security (RLS) Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

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

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;