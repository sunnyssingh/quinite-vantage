import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { hasDashboardPermission } from '@/lib/dashboardPermissions'

// GET /api/admin/users/[userId]/permissions
// Get all permissions for a specific user (role-based + user-specific)
export async function GET(request, { params }) {
    try {
        const { userId } = await params
        console.log(`[API] Fetching permissions for user: ${userId}`)
        const supabase = await createServerSupabaseClient()

        // Check if requester is super admin
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Use Admin Client for database operations to bypass RLS
        const admin = createAdminClient()

        // Get requester's profile to verify role
        const { data: requesterProfile } = await admin
            .from('profiles')
            .select('role, organization_id')
            .eq('id', user.id)
            .single()

        const canManagePermissions = await hasDashboardPermission(user.id, 'manage_permissions')

        if (!requesterProfile || !canManagePermissions) {
            return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 })
        }

        // Get target user's profile
        const { data: targetProfile, error: profileError } = await admin
            .from('profiles')
            .select('role, organization_id')
            .eq('id', userId)
            .single()

        if (profileError || !targetProfile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check same organization (skip for platform_admin if needed, but keeping safe for now)
        if (targetProfile.organization_id !== requesterProfile.organization_id && requesterProfile.role !== 'platform_admin') {
            return NextResponse.json({ error: 'Forbidden - Different organization' }, { status: 403 })
        }

        // Get all dashboard features
        const { data: allFeatures } = await admin
            .from('dashboard_features')
            .select('*')
            .eq('is_active', true)
            .order('category, feature_name')

        // Get role-based permissions
        const { data: rolePermissions } = await admin
            .from('dashboard_role_permissions')
            .select('feature_key')
            .eq('organization_id', targetProfile.organization_id)
            .eq('role', targetProfile.role)
            .eq('is_enabled', true)

        const rolePermissionKeys = rolePermissions?.map(p => p.feature_key) || []

        // Get user-specific permissions
        const { data: userPermissions } = await admin
            .from('dashboard_user_permissions')
            .select('feature_key, is_enabled, granted_by, created_at')
            .eq('user_id', userId)

        const userPermissionKeys = userPermissions
            ?.filter(p => p.is_enabled)
            .map(p => p.feature_key) || []

        // Calculate effective permissions (user-specific overrides role-based)
        const effectivePermissions = [
            ...new Set([
                ...userPermissionKeys,
                ...rolePermissionKeys.filter(key =>
                    !userPermissions?.some(up => up.feature_key === key)
                )
            ])
        ]

        return NextResponse.json({
            user: {
                id: userId,
                role: targetProfile.role
            },
            allFeatures: allFeatures || [],
            rolePermissions: rolePermissionKeys,
            userPermissions: userPermissionKeys,
            effectivePermissions,
            userPermissionDetails: userPermissions || []
        })

    } catch (error) {
        console.error('Error fetching user permissions:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/admin/users/[userId]/permissions
// Update user-specific permissions
export async function PUT(request, { params }) {
    try {
        const { userId } = await params
        const body = await request.json()
        const { permissions } = body // Array of feature_keys to grant

        if (!Array.isArray(permissions)) {
            return NextResponse.json({ error: 'Permissions must be an array' }, { status: 400 })
        }

        const supabase = await createServerSupabaseClient()

        // Check if requester is super admin
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Use Admin Client for database operations to bypass RLS
        const admin = createAdminClient()

        // Get requester's profile
        const { data: requesterProfile } = await admin
            .from('profiles')
            .select('role, organization_id')
            .eq('id', user.id)
            .single()

        const canManagePermissions = await hasDashboardPermission(user.id, 'manage_permissions')

        if (!requesterProfile || !canManagePermissions) {
            return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 })
        }

        // Get target user's profile
        const { data: targetProfile, error: profileError } = await admin
            .from('profiles')
            .select('role, organization_id')
            .eq('id', userId)
            .single()

        if (profileError || !targetProfile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check same organization
        if (targetProfile.organization_id !== requesterProfile.organization_id) {
            return NextResponse.json({ error: 'Forbidden - Different organization' }, { status: 403 })
        }

        // Cannot modify super_admin permissions
        if (targetProfile.role === 'super_admin') {
            return NextResponse.json({ error: 'Cannot modify super admin permissions' }, { status: 403 })
        }

        // Get role-based permissions for comparison
        const { data: rolePermissions } = await admin
            .from('dashboard_role_permissions')
            .select('feature_key')
            .eq('organization_id', targetProfile.organization_id)
            .eq('role', targetProfile.role)
            .eq('is_enabled', true)

        const rolePermissionKeys = rolePermissions?.map(p => p.feature_key) || []

        // Delete all existing user permissions
        await admin
            .from('dashboard_user_permissions')
            .delete()
            .eq('user_id', userId)

        // Insert only permissions that differ from role defaults
        const permissionsToInsert = permissions
            .filter(key => !rolePermissionKeys.includes(key)) // Only overrides
            .map(feature_key => ({
                user_id: userId,
                organization_id: targetProfile.organization_id,
                feature_key,
                is_enabled: true,
                granted_by: user.id
            }))

        if (permissionsToInsert.length > 0) {
            const { error: insertError } = await admin
                .from('dashboard_user_permissions')
                .insert(permissionsToInsert)

            if (insertError) {
                console.error('Error inserting user permissions:', insertError)
                return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 })
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Permissions updated successfully',
            overrideCount: permissionsToInsert.length
        })

    } catch (error) {
        console.error('Error updating user permissions:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
