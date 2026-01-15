import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/permissions'

export async function POST(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { password } = await request.json()

        if (!password || password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            )
        }

        const { error: updateError } = await supabase.auth.updateUser({
            password: password
        })

        if (updateError) {
            console.error('[Update Password] Error:', updateError)
            return NextResponse.json(
                { error: updateError.message },
                { status: 400 }
            )
        }

        // Get user profile for audit log
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, organization_id')
            .eq('id', user.id)
            .single()

        if (profile) {
            try {
                await logAudit(
                    supabase,
                    user.id,
                    profile.full_name || user.email,
                    'user.password_change',
                    'user',
                    user.id,
                    {},
                    profile.organization_id
                )
            } catch (auditError) {
                console.error('Audit log error:', auditError)
            }
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('[Update Password] Server Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
