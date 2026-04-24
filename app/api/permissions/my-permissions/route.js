import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserDashboardPermissions } from '@/lib/dashboardPermissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/permissions/my-permissions
 * Returns current user's dashboard permissions and the org's permission_version
 * for client-side cache busting (PermissionContext polls this every 60s).
 */
export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const admin = createAdminClient()

        const [permissions, profileResult] = await Promise.all([
            getUserDashboardPermissions(user.id),
            admin.from('profiles').select('organization_id').eq('id', user.id).single()
        ])

        let permissionVersion = 1
        if (profileResult.data?.organization_id) {
            const { data: org } = await admin
                .from('organizations')
                .select('permission_version')
                .eq('id', profileResult.data.organization_id)
                .single()
            permissionVersion = org?.permission_version ?? 1
        }

        return NextResponse.json({ permissions, permissionVersion, userId: user.id })
    } catch (error) {
        console.error('Error fetching user permissions:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
