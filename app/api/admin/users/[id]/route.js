import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/middleware/requireRole'
import { createAdminClient } from '@/lib/supabase/admin'
import { ValidationError, NotFoundError, handleApiError } from '@/lib/errors'

export async function GET(request, { params }) {
    try {
        const auth = await requireRole(request, ['super_admin'])
        if (auth instanceof NextResponse) return auth

        const { profile } = auth
        const { id } = params
        const admin = createAdminClient()

        // Get user details
        const { data: user, error } = await admin
            .from('profiles')
            .select('*')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single()

        if (error || !user) {
            throw new NotFoundError('User')
        }

        return NextResponse.json({ user })

    } catch (error) {
        const { status, body } = handleApiError(error)
        return NextResponse.json(body, { status })
    }
}

export async function PUT(request, { params }) {
    try {
        const auth = await requireRole(request, ['super_admin'])
        if (auth instanceof NextResponse) return auth

        const { profile } = auth
        const { id } = params
        const body = await request.json()
        const admin = createAdminClient()

        // Verify user belongs to same organization
        const { data: targetUser } = await admin
            .from('profiles')
            .select('organization_id')
            .eq('id', id)
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
            .eq('id', id)
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
            entity_id: id,
            metadata: {
                updated_fields: Object.keys(body),
                new_role: body.role
            }
        })

        return NextResponse.json({ user: updatedUser })

    } catch (error) {
        const { status, body } = handleApiError(error)
        return NextResponse.json(body, { status })
    }
}

export async function DELETE(request, { params }) {
    try {
        const auth = await requireRole(request, ['super_admin'])
        if (auth instanceof NextResponse) return auth

        const { profile } = auth
        const { id } = params
        const admin = createAdminClient()

        // Verify user belongs to same organization
        const { data: targetUser } = await admin
            .from('profiles')
            .select('organization_id')
            .eq('id', id)
            .single()

        if (!targetUser || targetUser.organization_id !== profile.organization_id) {
            throw new NotFoundError('User')
        }

        // Delete user from auth.users (will cascade to profiles)
        const { error: deleteError } = await admin.auth.admin.deleteUser(id)

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
            entity_id: id,
            metadata: { deleted_user_id: id }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        const { status, body } = handleApiError(error)
        return NextResponse.json(body, { status })
    }
}
