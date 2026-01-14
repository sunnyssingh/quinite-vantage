import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/permissions'
import { corsJSON } from '@/lib/cors'

/**
 * PUT /api/users/[id]
 * Update user details
 */
export async function PUT(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { fullName, phone, roleId } = body

        // Get current user's profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, is_platform_admin')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id && !profile?.is_platform_admin) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        const adminClient = createAdminClient()

        // Get target user to verify organization
        const { data: targetUser } = await adminClient
            .from('profiles')
            .select('id, organization_id, email, is_platform_admin')
            .eq('id', id)
            .single()

        if (!targetUser) {
            return corsJSON({ error: 'User not found' }, { status: 404 })
        }

        // Verify same organization (unless platform admin)
        if (!profile.is_platform_admin && targetUser.organization_id !== profile.organization_id) {
            return corsJSON({ error: 'Unauthorized' }, { status: 403 })
        }

        // Prevent editing Platform Admin
        if (targetUser.is_platform_admin) {
            return corsJSON({ error: 'Cannot edit Platform Admin users' }, { status: 403 })
        }

        // If roleId is provided, verify it's not Platform Admin
        if (roleId) {
            const { data: role } = await adminClient
                .from('roles')
                .select('name')
                .eq('id', roleId)
                .single()

            if (role?.name === 'Platform Admin') {
                return corsJSON({ error: 'Cannot assign Platform Admin role' }, { status: 403 })
            }
        }

        // Update profile
        const updateData = {}
        if (fullName !== undefined) updateData.full_name = fullName
        if (phone !== undefined) updateData.phone = phone
        if (roleId !== undefined) updateData.role_id = roleId

        const { data: updatedUser, error: updateError } = await adminClient
            .from('profiles')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (updateError) {
            console.error('User update error:', updateError)
            return corsJSON({ error: 'Failed to update user' }, { status: 500 })
        }

        // Audit log
        try {
            await logAudit(
                supabase,
                user.id,
                profile.full_name || user.email,
                'user.update',
                'user',
                id,
                { updated_user: targetUser.email },
                profile.organization_id
            )
        } catch (auditError) {
            console.error('Audit log error:', auditError)
        }

        return corsJSON({ user: updatedUser })
    } catch (e) {
        console.error('user PUT error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}

/**
 * DELETE /api/users/[id]
 * Delete user
 */
export async function DELETE(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Prevent self-deletion
        if (id === user.id) {
            return corsJSON({ error: 'Cannot delete your own account' }, { status: 400 })
        }

        // Get current user's profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, is_platform_admin, full_name')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id && !profile?.is_platform_admin) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        const adminClient = createAdminClient()

        // Get target user to verify organization
        const { data: targetUser } = await adminClient
            .from('profiles')
            .select('id, organization_id, email, is_platform_admin')
            .eq('id', id)
            .single()

        if (!targetUser) {
            return corsJSON({ error: 'User not found' }, { status: 404 })
        }

        // Verify same organization (unless platform admin)
        if (!profile.is_platform_admin && targetUser.organization_id !== profile.organization_id) {
            return corsJSON({ error: 'Unauthorized' }, { status: 403 })
        }

        // Prevent deleting Platform Admin
        if (targetUser.is_platform_admin) {
            return corsJSON({ error: 'Cannot delete Platform Admin users' }, { status: 403 })
        }

        // Delete user from Supabase Auth (this will cascade delete profile)
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(id)

        if (deleteError) {
            console.error('User deletion error:', deleteError)
            return corsJSON({ error: 'Failed to delete user' }, { status: 500 })
        }

        // Audit log
        try {
            await logAudit(
                supabase,
                user.id,
                profile.full_name || user.email,
                'user.delete',
                'user',
                id,
                { deleted_user: targetUser.email },
                profile.organization_id
            )
        } catch (auditError) {
            console.error('Audit log error:', auditError)
        }

        return corsJSON({ success: true })
    } catch (e) {
        console.error('user DELETE error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
