import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
    getAllDashboardFeatures,
    getRoleDashboardPermissions
} from '@/lib/dashboardPermissions'

/**
 * GET /api/permissions/roles
 * Returns all roles and their dashboard permissions
 * Admin only
 */
export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()

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

        // Only admins and platform admins can view role permissions
        if (profile.role !== 'super_admin' && profile.role !== 'platform_admin') {
            return NextResponse.json(
                { error: 'Forbidden: Admin access required' },
                { status: 403 }
            )
        }

        // Get all dashboard features
        const features = await getAllDashboardFeatures()

        // Get permissions for each role
        const roles = ['employee', 'manager', 'super_admin']
        const rolePermissions = {}

        for (const role of roles) {
            rolePermissions[role] = await getRoleDashboardPermissions(
                profile.organization_id,
                role
            )
        }

        return NextResponse.json({
            features,
            rolePermissions,
            roles
        })
    } catch (error) {
        console.error('Error fetching role permissions:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
