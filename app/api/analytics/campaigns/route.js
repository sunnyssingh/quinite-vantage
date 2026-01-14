import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/campaigns
 * Returns campaign performance metrics
 */
export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's organization
        const admin = createAdminClient()
        const { data: profile } = await admin
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        const adminClient = createAdminClient()

        // Build query
        let query = adminClient
            .from('campaigns')
            .select(`
        id,
        name,
        status,
        total_calls,
        transferred_calls,
        conversion_rate,
        created_at,
        project:projects (
          id,
          name
        )
      `)
            .order('conversion_rate', { ascending: false, nullsFirst: false })

        // Filter by organization
        if (!profile.is_platform_admin) {
            query = query.eq('organization_id', profile.organization_id)
        }

        const { data: campaigns, error } = await query

        if (error) throw error

        return corsJSON({ campaigns: campaigns || [] })
    } catch (e) {
        console.error('analytics campaigns error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
