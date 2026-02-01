import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export async function POST(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify Admin Access
        const admin = createAdminClient()
        const { data: profile } = await admin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        // Allow platform_admin and standard admin (adjust as needed)
        // Strictly only 'platform_admin' probably better for mass broadcast, 
        // but 'admin' might need to message their org members. 
        // For now, let's assume this is the SUPER ADMIN feature as requested.
        const isSuperAdmin = profile?.role === 'platform_admin'

        // If not super admin, maybe restrict? 
        // The user request said "saas super admin can send notification".
        if (!isSuperAdmin) {
            return corsJSON({ error: 'Only Platform Admins can send broadcasts' }, { status: 403 })
        }

        const body = await request.json()
        const {
            target_type,  // 'all', 'role', 'user'
            target_value, // role name or email
            type,         // 'info', 'warning', 'success', 'error'
            title,
            message,
            link
        } = body

        if (!title || !message) {
            return corsJSON({ error: 'Title and Message are required' }, { status: 400 })
        }

        let userIds = []

        // Resolve Targets
        if (target_type === 'all') {
            const { data: users, error } = await admin
                .from('profiles')
                .select('id')

            if (error) throw error
            userIds = users.map(u => u.id)

        } else if (target_type === 'role') {
            // target_value e.g. 'admin', 'member' 
            // note: profiles.role might be 'platform_admin' or just a role linked to generic roles.
            // Assuming 'role' column in profiles or joined with roles table.
            // For simplicity, querying profiles table 'role' column or join.
            // Let's assume profiles has a role column string for now or we check roles table.

            // If using the roles table relation:
            // This depends on schema. Current schema snippet suggests 'role_id'.
            // Let's try to find users by role name via join or direct column if simplified.

            // Checking permissions.js, it uses profiles.role_id -> roles.
            // So we need to find the role_id first.
            const { data: roleData } = await admin
                .from('roles')
                .select('id')
                .eq('name', target_value) // e.g. 'Admin', 'Member'
                .single()

            if (roleData) {
                const { data: users, error } = await admin
                    .from('profiles')
                    .select('id')
                    .eq('role_id', roleData.id)

                if (error) throw error
                userIds = users.map(u => u.id)
            } else {
                return corsJSON({ error: `Role '${target_value}' not found` }, { status: 404 })
            }

        } else if (target_type === 'user') {
            // target_value is email
            const { data: users, error } = await admin
                .from('profiles')
                .select('id')
                .eq('email', target_value)

            if (error) throw error
            userIds = users.map(u => u.id)
        }

        if (userIds.length === 0) {
            return corsJSON({ warning: 'No users found for this target', count: 0 })
        }

        // Batch Insert
        const notifications = userIds.map(uid => ({
            user_id: uid,
            type: type || 'info',
            title,
            message,
            link: link || null,
            is_read: false,
            created_at: new Date().toISOString()
        }))

        const { error: insertError } = await admin
            .from('notifications')
            .insert(notifications)

        if (insertError) throw insertError

        return corsJSON({
            success: true,
            count: userIds.length,
            message: `Notification sent to ${userIds.length} users`
        })

    } catch (e) {
        console.error('Platform Notifications API error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
