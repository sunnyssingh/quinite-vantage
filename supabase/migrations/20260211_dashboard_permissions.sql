-- ============================================================================
-- UNIFIED DASHBOARD WITH ROLE-BASED ACCESS CONTROL
-- Migration to add dashboard features and permissions
-- ============================================================================

-- Create dashboard_features table
CREATE TABLE IF NOT EXISTS dashboard_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_key VARCHAR(100) UNIQUE NOT NULL,
    feature_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'leads', 'campaigns', 'analytics', 'settings', 'users'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dashboard_features_key ON dashboard_features(feature_key);
CREATE INDEX IF NOT EXISTS idx_dashboard_features_category ON dashboard_features(category);

-- Insert default dashboard features
INSERT INTO dashboard_features (feature_key, feature_name, description, category) VALUES
    -- Lead Management
    ('view_own_leads', 'View Own Leads', 'View leads assigned to me', 'leads'),
    ('view_team_leads', 'View Team Leads', 'View leads assigned to team members', 'leads'),
    ('view_all_leads', 'View All Leads', 'View all leads in organization', 'leads'),
    ('create_leads', 'Create Leads', 'Create new leads', 'leads'),
    ('edit_own_leads', 'Edit Own Leads', 'Edit leads assigned to me', 'leads'),
    ('edit_team_leads', 'Edit Team Leads', 'Edit leads assigned to team members', 'leads'),
    ('edit_all_leads', 'Edit All Leads', 'Edit any lead in organization', 'leads'),
    ('delete_leads', 'Delete Leads', 'Delete leads', 'leads'),
    ('assign_leads', 'Assign Leads', 'Assign leads to team members', 'leads'),
    
    -- Campaign Management
    ('view_campaigns', 'View Campaigns', 'View campaigns', 'campaigns'),
    ('create_campaigns', 'Create Campaigns', 'Create new campaigns', 'campaigns'),
    ('edit_campaigns', 'Edit Campaigns', 'Edit existing campaigns', 'campaigns'),
    ('delete_campaigns', 'Delete Campaigns', 'Delete campaigns', 'campaigns'),
    ('run_campaigns', 'Run Campaigns', 'Execute and run campaigns', 'campaigns'),
    
    -- Project Management
    ('view_projects', 'View Projects', 'View projects', 'projects'),
    ('create_projects', 'Create Projects', 'Create new projects', 'projects'),
    ('edit_projects', 'Edit Projects', 'Edit existing projects', 'projects'),
    ('delete_projects', 'Delete Projects', 'Delete projects', 'projects'),
    
    -- Call Management
    ('view_own_calls', 'View Own Calls', 'View my call history', 'calls'),
    ('view_team_calls', 'View Team Calls', 'View team call history', 'calls'),
    ('view_all_calls', 'View All Calls', 'View all call history', 'calls'),
    ('make_calls', 'Make Calls', 'Initiate calls', 'calls'),
    
    -- Analytics & Insights
    ('view_own_analytics', 'View Own Analytics', 'View personal analytics', 'analytics'),
    ('view_team_analytics', 'View Team Analytics', 'View team analytics', 'analytics'),
    ('view_org_analytics', 'View Organization Analytics', 'View organization-wide analytics', 'analytics'),
    ('export_reports', 'Export Reports', 'Export analytics reports', 'analytics'),
    
    -- User Management
    ('view_users', 'View Users', 'View organization users', 'users'),
    ('create_users', 'Create Users', 'Create new users', 'users'),
    ('edit_users', 'Edit Users', 'Edit user details', 'users'),
    ('delete_users', 'Delete Users', 'Delete users', 'users'),
    ('manage_roles', 'Manage Roles', 'Assign roles to users', 'users'),
    
    -- Settings & Configuration
    ('view_settings', 'View Settings', 'View organization settings', 'settings'),
    ('edit_settings', 'Edit Settings', 'Edit organization settings', 'settings'),
    ('manage_permissions', 'Manage Permissions', 'Manage role permissions', 'settings'),
    ('view_billing', 'View Billing', 'View billing information', 'settings'),
    ('manage_billing', 'Manage Billing', 'Manage billing and subscriptions', 'settings'),
    
    -- Audit & Compliance
    ('view_audit_logs', 'View Audit Logs', 'View audit logs', 'audit'),
    
    -- Inventory Management
    ('view_inventory', 'View Inventory', 'View property inventory', 'inventory'),
    ('edit_inventory', 'Edit Inventory', 'Edit property inventory', 'inventory'),
    ('manage_inventory', 'Manage Inventory', 'Full inventory management', 'inventory')
ON CONFLICT (feature_key) DO NOTHING;

-- Create dashboard_role_permissions table (maps roles to dashboard features)
CREATE TABLE IF NOT EXISTS dashboard_role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'employee', 'manager', 'admin'
    feature_key VARCHAR(100) REFERENCES dashboard_features(feature_key) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, role, feature_key)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_role_perms_org ON dashboard_role_permissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_role_perms_role ON dashboard_role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_dashboard_role_perms_feature ON dashboard_role_permissions(feature_key);

-- Insert default permissions for Employee role
INSERT INTO dashboard_features (feature_key, feature_name, description, category)
SELECT 'employee_default_' || feature_key, feature_name, description, category
FROM (VALUES
    ('view_own_leads', 'View Own Leads', 'View leads assigned to me', 'leads'),
    ('create_leads', 'Create Leads', 'Create new leads', 'leads'),
    ('edit_own_leads', 'Edit Own Leads', 'Edit my leads', 'leads'),
    ('view_campaigns', 'View Campaigns', 'View campaigns', 'campaigns'),
    ('view_projects', 'View Projects', 'View projects', 'projects'),
    ('view_own_calls', 'View Own Calls', 'View my calls', 'calls'),
    ('make_calls', 'Make Calls', 'Make calls', 'calls'),
    ('view_own_analytics', 'View Own Analytics', 'View my analytics', 'analytics'),
    ('view_inventory', 'View Inventory', 'View inventory', 'inventory')
) AS defaults(feature_key, feature_name, description, category)
WHERE NOT EXISTS (
    SELECT 1 FROM dashboard_features WHERE feature_key = 'employee_default_' || defaults.feature_key
);

-- Function to seed default permissions for an organization
CREATE OR REPLACE FUNCTION seed_default_dashboard_permissions(org_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Employee permissions
    INSERT INTO dashboard_role_permissions (organization_id, role, feature_key, is_enabled)
    SELECT org_id, 'employee', feature_key, true
    FROM dashboard_features
    WHERE feature_key IN (
        'view_own_leads', 'create_leads', 'edit_own_leads',
        'view_campaigns', 'view_projects',
        'view_own_calls', 'make_calls',
        'view_own_analytics',
        'view_inventory'
    )
    ON CONFLICT (organization_id, role, feature_key) DO NOTHING;
    
    -- Manager permissions (includes all employee permissions + more)
    INSERT INTO dashboard_role_permissions (organization_id, role, feature_key, is_enabled)
    SELECT org_id, 'manager', feature_key, true
    FROM dashboard_features
    WHERE feature_key IN (
        'view_own_leads', 'view_team_leads', 'create_leads', 'edit_own_leads', 'edit_team_leads', 'assign_leads',
        'view_campaigns', 'create_campaigns', 'edit_campaigns', 'run_campaigns',
        'view_projects', 'create_projects', 'edit_projects',
        'view_own_calls', 'view_team_calls', 'make_calls',
        'view_own_analytics', 'view_team_analytics', 'export_reports',
        'view_users',
        'view_inventory', 'edit_inventory'
    )
    ON CONFLICT (organization_id, role, feature_key) DO NOTHING;
    
    -- Admin permissions (full access)
    INSERT INTO dashboard_role_permissions (organization_id, role, feature_key, is_enabled)
    SELECT org_id, feature_key, true
    FROM dashboard_features
    WHERE is_active = true
    ON CONFLICT (organization_id, role, feature_key) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Seed permissions for all existing organizations
DO $$
DECLARE
    org RECORD;
BEGIN
    FOR org IN SELECT id FROM organizations LOOP
        PERFORM seed_default_dashboard_permissions(org.id);
    END LOOP;
END $$;

-- Enable RLS on dashboard tables
ALTER TABLE dashboard_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dashboard_features (everyone can read)
CREATE POLICY "Anyone can view dashboard features"
    ON dashboard_features FOR SELECT
    USING (true);

-- RLS Policies for dashboard_role_permissions (users can view their org's permissions)
CREATE POLICY "Users can view their org's role permissions"
    ON dashboard_role_permissions FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Only admins can modify permissions
CREATE POLICY "Admins can manage role permissions"
    ON dashboard_role_permissions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND organization_id = dashboard_role_permissions.organization_id
            AND role IN ('admin', 'platform_admin')
        )
    );

-- Grant permissions
GRANT SELECT ON dashboard_features TO authenticated;
GRANT SELECT ON dashboard_role_permissions TO authenticated;
GRANT ALL ON dashboard_role_permissions TO authenticated;

-- Add comments
COMMENT ON TABLE dashboard_features IS 'Available dashboard features/permissions';
COMMENT ON TABLE dashboard_role_permissions IS 'Role-based permissions for dashboard features per organization';
COMMENT ON COLUMN dashboard_role_permissions.role IS 'User role: employee, manager, or admin';
COMMENT ON COLUMN dashboard_role_permissions.is_enabled IS 'Whether this feature is enabled for this role';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ DASHBOARD PERMISSIONS MIGRATION COMPLETED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '- dashboard_features table with % features', (SELECT COUNT(*) FROM dashboard_features);
    RAISE NOTICE '- dashboard_role_permissions table';
    RAISE NOTICE '- Default permissions seeded for all organizations';
    RAISE NOTICE '';
END $$;
