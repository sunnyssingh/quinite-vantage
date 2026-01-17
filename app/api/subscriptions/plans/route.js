import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminClient = createAdminClient()

        // Get all active plans
        const { data: plans, error } = await adminClient
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

        if (error) throw error

        return corsJSON({ plans })
    } catch (e) {
        console.error('subscriptions/plans GET error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
