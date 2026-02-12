import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/middleware/requireRole'
import { createAdminClient } from '@/lib/supabase/admin'
import { ValidationError, NotFoundError, handleApiError } from '@/lib/errors'

export async function GET(request, { params }) {
    try {
        const auth = await requireRole(request, ['super_admin'])
        if (auth instanceof NextResponse) return auth

        const { profile } = auth
        const { userId } = await params
        const admin = createAdminClient()

        // Get user details
        const { data: user, error } = await admin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .eq('organization_id', profile.organization_id)
            .single()

        if (error || !user) {
            throw new NotFoundError('User')
        }

        return corsJSON({ user })

    } catch (error) {
        const { status, body } = handleApiError(error)
        return corsJSON(body, { status })
    }
}

export async function PUT(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check permission
        const canManage = await hasDashboardPermission(user.id, 'manage_users')
        if (!canManage) {
            return corsJSON({ error: 'Forbidden - Missing "manage_users" permission' }, { status: 403 })
        }

        const { userId } = await params
        const body = await request.json()
        const admin = createAdminClient()

        // Get user's organization first
        const { data: profile } = await admin.from('profiles').select('organization_id, id, full_name').eq('id', user.id).single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 404 })
        }

        // Verify user belongs to same organization
        const { data: targetUser } = await admin
            .from('profiles')
            .select('organization_id')
            .eq('id', userId)
            .single()

        if (!targetUser || targetUser.organization_id !== profile.organization_id) {
            throw new NotFoundError('User')
        }

        // Update user profile
        const { data: updatedUser, error } = await admin
            .from('profiles')
            .update({
                full_name: body.fullName,
                email: body.email,
                phone: body.phone,
                role: body.role,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single()

        if (error) {
            throw new Error('Failed to update user')
        }

        // Create audit log
        await admin.from('audit_logs').insert({
            organization_id: profile.organization_id,
            user_id: profile.id,
            user_name: profile.full_name,
            action: 'user.updated',
            entity_type: 'user',
            entity_id: userId,
            metadata: {
                updated_fields: Object.keys(body),
                new_role: body.role
            }
        })

        return corsJSON({ user: updatedUser })

    } catch (error) {
        const { status, body } = handleApiError(error)
        return corsJSON(body, { status })
    }
}

export async function DELETE(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check permission
        const canManage = await hasDashboardPermission(user.id, 'manage_users')
        if (!canManage) {
            return corsJSON({ error: 'Forbidden - Missing "manage_users" permission' }, { status: 403 })
        }

        const { userId } = await params
        const admin = createAdminClient()

        // Get user's organization first
        const { data: profile } = await admin.from('profiles').select('organization_id, id, full_name').eq('id', user.id).single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 404 })
        }

        // Verify user belongs to same organization
        const { data: targetUser } = await admin
            .from('profiles')
            .select('organization_id')
            .eq('id', userId)
            .single()

        if (!targetUser || targetUser.organization_id !== profile.organization_id) {
            throw new NotFoundError('User')
        }

        // Delete user from auth.users (will cascade to profiles)
        const { error: deleteError } = await admin.auth.admin.deleteUser(userId)

        if (deleteError) {
            throw new Error('Failed to delete user')
        }

        // Create audit log
        await admin.from('audit_logs').insert({
            organization_id: profile.organization_id,
            user_id: profile.id,
            user_name: profile.full_name,
            action: 'user.deleted',
            entity_type: 'user',
            entity_id: userId,
            metadata: { deleted_user_id: userId }
        })

        return corsJSON({ success: true })

    } catch (error) {
        const { status, body } = handleApiError(error)
        return corsJSON(body, { status })
    }
}
