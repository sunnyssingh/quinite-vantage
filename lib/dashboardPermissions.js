import { createAdminClient } from './supabase/admin'

/**
 * Dashboard-specific permission utilities
 * Uses the dashboard_features and dashboard_role_permissions tables
 */

/**
 * Get all dashboard permissions for a user based on their role
 * @param {string} userId - User ID
 * @returns {Promise<string[]>} Array of feature keys the user has access to
 */
export async function getUserDashboardPermissions(userId) {
    try {
        const admin = createAdminClient()

        // Get user profile with role and organization
        const { data: profile, error: profileError } = await admin
            .from('profiles')
            .select('organization_id, role')
            .eq('id', userId)
            .single()

        if (profileError || !profile) {
            console.error('Error fetching user profile:', profileError)
            return []
        }

        // Platform admins have all permissions
        if (profile.role === 'platform_admin') {
            const { data: allFeatures } = await admin
                .from('dashboard_features')
                .select('feature_key')
                .eq('is_active', true)

            return allFeatures?.map(f => f.feature_key) || []
        }

        // Super admins have all permissions
        if (profile.role === 'super_admin') {
            const { data: allFeatures } = await admin
                .from('dashboard_features')
                .select('feature_key')
                .eq('is_active', true)

            return allFeatures?.map(f => f.feature_key) || []
        }

        // Get user-specific permissions
        const { data: userPermissions } = await admin
            .from('dashboard_user_permissions')
            .select('feature_key')
            .eq('user_id', userId)
            .eq('is_enabled', true)

        const userPermissionKeys = userPermissions?.map(p => p.feature_key) || []

        // Get role-based dashboard permissions for the user's organization
        const { data: rolePermissions, error: permError } = await admin
            .from('dashboard_role_permissions')
            .select('feature_key')
            .eq('organization_id', profile.organization_id)
            .eq('role', profile.role)
            .eq('is_enabled', true)

        if (permError) {
            console.error('Error fetching dashboard permissions:', permError)
            return userPermissionKeys // Return at least user permissions
        }

        const rolePermissionKeys = rolePermissions?.map(p => p.feature_key) || []

        // Combine: user-specific permissions + role permissions (excluding overridden ones)
        const effectivePermissions = [
            ...userPermissionKeys,
            ...rolePermissionKeys.filter(key => !userPermissions?.some(up => up.feature_key === key))
        ]

        return [...new Set(effectivePermissions)] // Remove duplicates
    } catch (error) {
        console.error('Error in getUserDashboardPermissions:', error)
        return []
    }
}

/**
 * Check if a user has a specific dashboard permission
 * @param {string} userId - User ID
 * @param {string} featureKey - Feature key to check
 * @returns {Promise<boolean>} True if user has permission
 */
export async function hasDashboardPermission(userId, featureKey) {
    try {
        const admin = createAdminClient()

        // Get user profile with role
        const { data: profile, error: profileError } = await admin
            .from('profiles')
            .select('organization_id, role')
            .eq('id', userId)
            .single()

        if (profileError || !profile) {
            return false
        }

        // Platform admins have all permissions
        if (profile.role === 'platform_admin' || profile.role === 'super_admin') {
            return true
        }

        // Check if user's role has this permission
        const { data: permission, error: permError } = await admin
            .from('dashboard_role_permissions')
            .select('is_enabled')
            .eq('organization_id', profile.organization_id)
            .eq('role', profile.role)
            .eq('feature_key', featureKey)
            .maybeSingle()

        if (permError) {
            return false
        }

        return permission?.is_enabled === true
    } catch (error) {
        console.error('Error in hasDashboardPermission:', error)
        return false
    }
}

/**
 * Check if user has any of the specified dashboard permissions
 * @param {string} userId - User ID
 * @param {string[]} featureKeys - Array of feature keys
 * @returns {Promise<boolean>} True if user has at least one permission
 */
export async function hasAnyDashboardPermission(userId, featureKeys) {
    const permissions = await getUserDashboardPermissions(userId)
    return featureKeys.some(key => permissions.includes(key))
}

/**
 * Check if user has all of the specified dashboard permissions
 * @param {string} userId - User ID
 * @param {string[]} featureKeys - Array of feature keys
 * @returns {Promise<boolean>} True if user has all permissions
 */
export async function hasAllDashboardPermissions(userId, featureKeys) {
    const permissions = await getUserDashboardPermissions(userId)
    return featureKeys.every(key => permissions.includes(key))
}

/**
 * Get all available dashboard features grouped by category
 * @returns {Promise<Object>} Dashboard features grouped by category
 */
export async function getAllDashboardFeatures() {
    try {
        const admin = createAdminClient()

        const { data: features, error } = await admin
            .from('dashboard_features')
            .select('*')
            .eq('is_active', true)
            .order('category', { ascending: true })
            .order('feature_name', { ascending: true })

        if (error) {
            console.error('Error fetching dashboard features:', error)
            return {}
        }

        // Group by category
        const grouped = {}
        features?.forEach(feature => {
            const category = feature.category || 'other'
            if (!grouped[category]) {
                grouped[category] = []
            }
            grouped[category].push(feature)
        })

        return grouped
    } catch (error) {
        console.error('Error in getAllDashboardFeatures:', error)
        return {}
    }
}

/**
 * Get role permissions for an organization
 * @param {string} organizationId - Organization ID
 * @param {string} role - Role name (employee, manager, admin)
 * @returns {Promise<Object>} Object with feature_key as keys and is_enabled as values
 */
export async function getRoleDashboardPermissions(organizationId, role) {
    try {
        const admin = createAdminClient()

        const { data: permissions, error } = await admin
            .from('dashboard_role_permissions')
            .select('feature_key, is_enabled')
            .eq('organization_id', organizationId)
            .eq('role', role)

        if (error) {
            console.error('Error fetching role dashboard permissions:', error)
            return {}
        }

        // Convert to object for easier lookup
        const permMap = {}
        permissions?.forEach(perm => {
            permMap[perm.feature_key] = perm.is_enabled
        })

        return permMap
    } catch (error) {
        console.error('Error in getRoleDashboardPermissions:', error)
        return {}
    }
}

/**
 * Update role dashboard permission
 * @param {string} organizationId - Organization ID
 * @param {string} role - Role name
 * @param {string} featureKey - Feature key
 * @param {boolean} isEnabled - Whether to enable or disable
 * @returns {Promise<boolean>} Success status
 */
export async function updateRoleDashboardPermission(organizationId, role, featureKey, isEnabled) {
    try {
        const admin = createAdminClient()

        const { error } = await admin
            .from('dashboard_role_permissions')
            .upsert({
                organization_id: organizationId,
                role,
                feature_key: featureKey,
                is_enabled: isEnabled,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'organization_id,role,feature_key'
            })

        if (error) {
            console.error('Error updating role dashboard permission:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('Error in updateRoleDashboardPermission:', error)
        return false
    }
}

/**
 * Batch update role permissions
 * @param {string} organizationId - Organization ID
 * @param {string} role - Role name
 * @param {Object} permissions - Object with feature_key as keys and boolean as values
 * @returns {Promise<boolean>} Success status
 */
export async function batchUpdateRoleDashboardPermissions(organizationId, role, permissions) {
    try {
        const admin = createAdminClient()

        const updates = Object.entries(permissions).map(([featureKey, isEnabled]) => ({
            organization_id: organizationId,
            role,
            feature_key: featureKey,
            is_enabled: isEnabled,
            updated_at: new Date().toISOString()
        }))

        const { error } = await admin
            .from('dashboard_role_permissions')
            .upsert(updates, {
                onConflict: 'organization_id,role,feature_key'
            })

        if (error) {
            console.error('Error batch updating role dashboard permissions:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('Error in batchUpdateRoleDashboardPermissions:', error)
        return false
    }
}
