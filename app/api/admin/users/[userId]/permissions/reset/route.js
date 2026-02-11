import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/admin/users/[userId]/permissions/reset
// Reset user to role-based permissions (remove all user-specific overrides)
export async function POST(request, { params }) {
    try {
        const { userId } = await params
        const supabase = await createServerSupabaseClient()

        // Check if requester is super admin
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get requester's profile
        const { data: requesterProfile } = await supabase
            .from('profiles')
            .select('role, organization_id')
            .eq('id', user.id)
            .single()

        if (!requesterProfile || requesterProfile.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 })
        }

        // Get target user's profile
        const { data: targetProfile, error: profileError } = await supabase
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

        // Delete all user-specific permissions
        const { error: deleteError } = await supabase
            .from('dashboard_user_permissions')
            .delete()
            .eq('user_id', userId)

        if (deleteError) {
            console.error('Error resetting user permissions:', deleteError)
            return NextResponse.json({ error: 'Failed to reset permissions' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: 'User permissions reset to role defaults'
        })

    } catch (error) {
        console.error('Error resetting user permissions:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
