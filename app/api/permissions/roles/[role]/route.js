import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { updateRoleDashboardPermission } from '@/lib/dashboardPermissions'

/**
 * PUT /api/permissions/roles/[role]
 * Update permissions for a specific role
 * Admin only
 */
export async function PUT(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { role } = params

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get user profile to check role and organization
        const admin = createAdminClient()
        const { data: profile, error: profileError } = await admin
            .from('profiles')
            .select('role, organization_id')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            return NextResponse.json(
                { error: 'Profile not found' },
                { status: 404 }
            )
        }

        // Only admins can update role permissions
        if (profile.role !== 'super_admin' && profile.role !== 'platform_admin') {
            return NextResponse.json(
                { error: 'Forbidden: Admin access required' },
                { status: 403 }
            )
        }

        // Get request body
        const body = await request.json()
        const { feature_key, is_enabled } = body

        if (!feature_key || typeof is_enabled !== 'boolean') {
            return NextResponse.json(
                { error: 'Invalid request: feature_key and is_enabled required' },
                { status: 400 }
            )
        }

        // Update permission
        const success = await updateRoleDashboardPermission(
            profile.organization_id,
            role,
            feature_key,
            is_enabled
        )

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to update permission' },
                { status: 500 }
            )
        }

        // Bump permission_version so active clients know to re-fetch their permissions
        const { data: org } = await admin
            .from('organizations')
            .select('permission_version')
            .eq('id', profile.organization_id)
            .single()
        await admin
            .from('organizations')
            .update({ permission_version: (org?.permission_version || 1) + 1 })
            .eq('id', profile.organization_id)

        return NextResponse.json({
            success: true,
            message: `Permission ${feature_key} ${is_enabled ? 'enabled' : 'disabled'} for ${role}`
        })
    } catch (error) {
        console.error('Error updating role permission:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
