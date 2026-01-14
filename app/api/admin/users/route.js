import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/middleware/requireRole'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - List all users in organization
export async function GET(request) {
    try {
        // Only super_admin can access
        const auth = await requireRole(request, ['super_admin'])
        if (auth instanceof NextResponse) return auth

        const { profile } = auth
        const admin = createAdminClient()

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

        return NextResponse.json({ users })

    } catch (error) {
        console.error('[GET /api/admin/users] Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST - Create new user (not implemented yet - will use invite endpoint)
export async function POST(request) {
    return NextResponse.json(
        { error: 'Use /api/admin/users/invite to invite users' },
        { status: 400 }
    )
}
