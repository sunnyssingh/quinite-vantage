import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/middleware/requireRole'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request) {
    try {
        // Only super_admin can invite users
        const auth = await requireRole(request, ['super_admin'])
        if (auth instanceof NextResponse) return auth

        const { profile } = auth
        const body = await request.json()
        const { email, phone, fullName, role = 'employee' } = body

        // Validate input
        if (!email || !fullName || !phone) {
            return NextResponse.json(
                { error: 'Email, phone, and full name are required' },
                { status: 400 }
            )
        }

        // Validate role
        const validRoles = ['employee', 'manager', 'super_admin']
        if (!validRoles.includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            )
        }

        const admin = createAdminClient()

        // Create user in auth.users
        const { data: newUser, error: createError } = await admin.auth.admin.createUser({
            email,
            email_confirm: true, // Auto-confirm email
            phone: phone || undefined,
            phone_confirm: !!phone,
            user_metadata: {
                full_name: fullName
            }
        })

        if (createError) {
            console.error('[POST /api/admin/users/invite] Create error:', createError)
            return NextResponse.json(
                { error: createError.message || 'Failed to create user' },
                { status: 400 }
            )
        }

        // Update profile with organization and role
        const { error: updateError } = await admin
            .from('profiles')
            .update({
                organization_id: profile.organization_id,
                role: role,
                full_name: fullName,
                phone: phone || null
            })
            .eq('id', newUser.user.id)

        if (updateError) {
            console.error('[POST /api/admin/users/invite] Update error:', updateError)
            // Rollback: delete the auth user
            await admin.auth.admin.deleteUser(newUser.user.id)
            return NextResponse.json(
                { error: 'Failed to set up user profile' },
                { status: 500 }
            )
        }

        // Create audit log
        await admin.from('audit_logs').insert({
            organization_id: profile.organization_id,
            user_id: profile.id,
            user_name: profile.full_name,
            action: 'user.created',
            entity_type: 'user',
            entity_id: newUser.user.id,
            metadata: {
                email,
                phone,
                role
            }
        })

        // TODO: Send invitation email with password reset link
        // For now, user will need to use "Forgot Password" to set their password

        return NextResponse.json({
            success: true,
            user: {
                id: newUser.user.id,
                email,
                full_name: fullName,
                role
            }
        })

    } catch (error) {
        console.error('[POST /api/admin/users/invite] Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
