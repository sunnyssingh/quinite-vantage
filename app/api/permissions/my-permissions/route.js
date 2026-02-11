import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserDashboardPermissions } from '@/lib/dashboardPermissions'

/**
 * GET /api/permissions/my-permissions
 * Returns current user's dashboard permissions
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

        // Get user's dashboard permissions
        const permissions = await getUserDashboardPermissions(user.id)

        return NextResponse.json({
            permissions,
            userId: user.id
        })
    } catch (error) {
        console.error('Error fetching user permissions:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
