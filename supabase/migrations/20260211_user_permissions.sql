-- ============================================================================
-- USER-SPECIFIC PERMISSION MANAGEMENT
-- Migration to add per-user permission overrides
-- ============================================================================

-- Create dashboard_user_permissions table for user-specific permission overrides
CREATE TABLE IF NOT EXISTS dashboard_user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    feature_key VARCHAR(100) NOT NULL REFERENCES dashboard_features(feature_key) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    granted_by UUID REFERENCES profiles(id), -- Who granted this permission
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, feature_key)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_perms_user ON dashboard_user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_perms_org ON dashboard_user_permissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_perms_feature ON dashboard_user_permissions(feature_key);
CREATE INDEX IF NOT EXISTS idx_user_perms_granted_by ON dashboard_user_permissions(granted_by);

-- Enable RLS on dashboard_user_permissions
ALTER TABLE dashboard_user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own permissions
CREATE POLICY "Users can view their own permissions"
    ON dashboard_user_permissions FOR SELECT
    USING (
        user_id = auth.uid()
        OR
        -- Super admins can view all permissions in their org
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'super_admin'
            AND organization_id = dashboard_user_permissions.organization_id
        )
    );

-- RLS Policy: Only super admins can manage user permissions
CREATE POLICY "Super admins can manage user permissions"
    ON dashboard_user_permissions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'super_admin'
            AND organization_id = dashboard_user_permissions.organization_id
        )
    );

-- Function to get effective permissions for a user (user-specific + role-based)
CREATE OR REPLACE FUNCTION get_user_effective_permissions(
    p_user_id UUID,
    p_organization_id UUID,
    p_role VARCHAR(50)
)
RETURNS TABLE(feature_key VARCHAR(100), source VARCHAR(20)) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT 
        COALESCE(dup.feature_key, drp.feature_key) as feature_key,
        CASE 
            WHEN dup.feature_key IS NOT NULL THEN 'user'
            ELSE 'role'
        END as source
    FROM dashboard_features df
    LEFT JOIN dashboard_user_permissions dup 
        ON dup.feature_key = df.feature_key 
        AND dup.user_id = p_user_id 
        AND dup.is_enabled = true
    LEFT JOIN dashboard_role_permissions drp 
        ON drp.feature_key = df.feature_key 
        AND drp.organization_id = p_organization_id 
        AND drp.role = p_role 
        AND drp.is_enabled = true
    WHERE 
        df.is_active = true
        AND (
            -- User-specific permission exists and is enabled
            (dup.feature_key IS NOT NULL AND dup.is_enabled = true)
            OR
            -- Role permission exists and no user-specific override
            (drp.feature_key IS NOT NULL AND drp.is_enabled = true AND dup.feature_key IS NULL)
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset user to role-based permissions
CREATE OR REPLACE FUNCTION reset_user_permissions(
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    DELETE FROM dashboard_user_permissions
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_permissions_timestamp
    BEFORE UPDATE ON dashboard_user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_permissions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE dashboard_user_permissions IS 'User-specific permission overrides that take precedence over role-based permissions';
COMMENT ON COLUMN dashboard_user_permissions.user_id IS 'User who has this permission override';
COMMENT ON COLUMN dashboard_user_permissions.granted_by IS 'Super admin who granted this permission';
COMMENT ON FUNCTION get_user_effective_permissions IS 'Returns all effective permissions for a user (user-specific overrides + role defaults)';
COMMENT ON FUNCTION reset_user_permissions IS 'Removes all user-specific permission overrides, reverting to role defaults';
