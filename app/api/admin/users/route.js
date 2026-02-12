import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasDashboardPermission } from '@/lib/dashboardPermissions'
import { corsJSON } from '@/lib/cors'

// GET - List all users in organization
export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check permission
        const canView = await hasDashboardPermission(user.id, 'view_users')
        if (!canView) {
            return corsJSON({ error: 'Forbidden - Missing "view_users" permission' }, { status: 403 })
        }

        const admin = createAdminClient()

        // Get user's organization first
        const { data: profile } = await admin.from('profiles').select('organization_id').eq('id', user.id).single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 404 })
        }

        // Get all users in the organization
        const { data: users, error } = await admin
            .from('profiles')
            .select('id, full_name, email, role, phone, created_at, updated_at')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[GET /api/admin/users] Error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch users' },
                { status: 500 }
            )
        }

        return corsJSON({ users })

    } catch (error) {
        console.error('[GET /api/admin/users] Error:', error)
        return corsJSON({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Create new user (not implemented yet - will use invite endpoint)
export async function POST(request) {
    return NextResponse.json(
        { error: 'Use /api/admin/users/invite to invite users' },
        { status: 400 }
    )
}
