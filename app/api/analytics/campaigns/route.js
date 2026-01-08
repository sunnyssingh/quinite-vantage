import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasPermission } from '@/lib/permissions'
import { corsJSON } from '@/lib/cors'

/**
 * GET /api/analytics/campaigns
 * Returns campaign performance metrics
 */
export async function GET() {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check permission
        const canView = await hasPermission(supabase, user.id, 'analytics.view_basic')
        if (!canView) {
            return corsJSON({ error: 'Insufficient permissions' }, { status: 403 })
        }

        // Get user's profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, is_platform_admin')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id && !profile?.is_platform_admin) {
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
