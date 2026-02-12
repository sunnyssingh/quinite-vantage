import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hasDashboardPermission } from '@/lib/dashboardPermissions'
import { corsJSON } from '@/lib/cors'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check permission
        const canInvite = await hasDashboardPermission(user.id, 'invite_users')
        if (!canInvite) {
            return corsJSON({ error: 'Forbidden - Missing "invite_users" permission' }, { status: 403 })
        }

        const admin = createAdminClient()

        // Get user's organization first
        const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 404 })
        }
        const body = await request.json()
        const { email, phone, fullName, role = 'employee' } = body

        // Validate input
        if (!email || !fullName || !phone) {
            return corsJSON({ error: 'Email, phone, and full name are required' }, { status: 400 })
        }

        // Validate role
        const validRoles = ['employee', 'manager', 'super_admin']
        if (!validRoles.includes(role)) {
            return corsJSON({ error: 'Invalid role' }, { status: 400 })
        }



        // Generate a random 12-char password
        const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4)

        // Create user in auth.users
        const { data: newUser, error: createError } = await admin.auth.admin.createUser({
            email,
            password, // Set the generated password
            email_confirm: true, // Auto-confirm email
            phone: phone || undefined,
            phone_confirm: !!phone,
            user_metadata: {
                full_name: fullName
            }
        })

        if (createError) {
            console.error('[POST /api/admin/users/invite] Create error:', createError)
            return corsJSON({ error: createError.message || 'Failed to create user' }, { status: 400 })
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
            return corsJSON({ error: 'Failed to set up user profile' }, { status: 500 })
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

        return corsJSON({
            success: true,
            user: {
                id: newUser.user.id,
                email,
                full_name: fullName,
                role,
                tempPassword: password // Return the password for display
            }
        })

    } catch (error) {
        console.error('[POST /api/admin/users/invite] Error:', error)
        return corsJSON({ error: 'Internal server error' }, { status: 500 })
    }
}
