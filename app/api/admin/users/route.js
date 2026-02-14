import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'
import { withPermission } from '@/lib/middleware/withAuth'
import { UserService } from '@/services/user.service'
import { NextResponse } from 'next/server'

/**
 * GET - List all users in organization
 */
/**
 * GET - List all users in organization
 */
export const GET = withPermission(['view_users', 'assign_leads', 'create_leads', 'edit_all_leads', 'edit_team_leads', 'edit_own_leads'], async (request, context) => {
    try {
        const { profile } = context

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 404 })
        }

        // Get all users using service
        const users = await UserService.getUsers(profile.organization_id)

        return corsJSON({ users })

    } catch (error) {
        console.error('[GET /api/admin/users] Error:', error)
        return corsJSON({ error: 'Internal server error' }, { status: 500 })
    }
})

// POST - Create new user (not implemented yet - will use invite endpoint)
export async function POST(request) {
    return NextResponse.json(
        { error: 'Use /api/admin/users/invite to invite users' },
        { status: 400 }
    )
}
