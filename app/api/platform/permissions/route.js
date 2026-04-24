import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { updateRoleDashboardPermission } from '@/lib/dashboardPermissions'

/**
 * GET /api/platform/permissions?orgId=xxx
 * Returns all features + role permissions for an org (platform admin only)
 *
 * PUT /api/platform/permissions?orgId=xxx
 * Body: { role, feature_key, is_enabled }
 * Updates a single role permission for the org and bumps permission_version
 */

async function getPlatformAdminProfile(supabase, admin, userId) {
    const { data: profile } = await admin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
    return profile
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const orgId = searchParams.get('orgId')

        if (!orgId) {
            return NextResponse.json({ error: 'orgId required' }, { status: 400 })
        }

        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const admin = createAdminClient()
        const profile = await getPlatformAdminProfile(supabase, admin, user.id)

        if (!profile || profile.role !== 'platform_admin') {
            return NextResponse.json({ error: 'Platform admin access required' }, { status: 403 })
        }

        const [featuresResult, managerResult, employeeResult] = await Promise.all([
            admin.from('features').select('*').eq('is_active', true).order('category').order('feature_name'),
            admin.from('role_permissions').select('feature_key, is_enabled').eq('organization_id', orgId).eq('role', 'manager'),
            admin.from('role_permissions').select('feature_key, is_enabled').eq('organization_id', orgId).eq('role', 'employee'),
        ])

        const toMap = (rows) => {
            const map = {}
            rows?.forEach(r => { map[r.feature_key] = r.is_enabled })
            return map
        }

        return NextResponse.json({
            features: featuresResult.data || [],
            rolePermissions: {
                manager: toMap(managerResult.data),
                employee: toMap(employeeResult.data),
            }
        })
    } catch (error) {
        console.error('[Platform Permissions GET]', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url)
        const orgId = searchParams.get('orgId')

        if (!orgId) {
            return NextResponse.json({ error: 'orgId required' }, { status: 400 })
        }

        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const admin = createAdminClient()
        const profile = await getPlatformAdminProfile(supabase, admin, user.id)

        if (!profile || profile.role !== 'platform_admin') {
            return NextResponse.json({ error: 'Platform admin access required' }, { status: 403 })
        }

        const body = await request.json()
        const { role, feature_key, is_enabled } = body

        if (!role || !feature_key || typeof is_enabled !== 'boolean') {
            return NextResponse.json({ error: 'role, feature_key, and is_enabled are required' }, { status: 400 })
        }

        if (!['manager', 'employee'].includes(role)) {
            return NextResponse.json({ error: 'Only manager and employee roles can be modified' }, { status: 400 })
        }

        const success = await updateRoleDashboardPermission(orgId, role, feature_key, is_enabled)
        if (!success) {
            return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 })
        }

        // Bump permission_version so active clients for this org re-fetch within ~60s
        const { data: org } = await admin
            .from('organizations')
            .select('permission_version')
            .eq('id', orgId)
            .single()
        await admin
            .from('organizations')
            .update({ permission_version: (org?.permission_version || 1) + 1 })
            .eq('id', orgId)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[Platform Permissions PUT]', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
