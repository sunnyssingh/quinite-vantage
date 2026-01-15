import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export const dynamic = 'force-dynamic'

export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify platform admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'platform_admin') {
            return corsJSON({ error: 'Forbidden' }, { status: 403 })
        }

        const adminClient = createAdminClient()

        // Fetch active session
        const { data: sessions, error } = await adminClient
            .from('impersonation_sessions')
            .select(`
        *,
        impersonated_user:profiles!impersonated_user_id(email, full_name),
        impersonated_org:organizations!impersonated_org_id(name)
      `)
            .eq('impersonator_user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching impersonations:', error)
            return corsJSON({ error: error.message }, { status: 500 })
        }

        return corsJSON({ sessions })
    } catch (e) {
        console.error('impersonations error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
