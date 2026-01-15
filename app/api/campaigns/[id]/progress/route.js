import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export const dynamic = 'force-dynamic'

/**
 * GET /api/campaigns/[id]/progress
 * Returns real-time progress of a campaign
 */
export async function GET(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const adminClient = createAdminClient()

        // 1. Get Campaign Info (Status & Project ID)
        const { data: campaign, error: campError } = await adminClient
            .from('campaigns')
            .select('status, project_id, organization_id')
            .eq('id', id)
            .single()

        if (campError || !campaign) {
            return corsJSON({ error: 'Campaign not found' }, { status: 404 })
        }

        // 2. Count Total Leads in Project
        const { count: totalLeads } = await adminClient
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', campaign.organization_id)
            .eq('project_id', campaign.project_id)

        // 3. Count Processed Leads (Call Logs for this campaign)
        const { count: processedLeads } = await adminClient
            .from('call_logs')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', id)

        return corsJSON({
            status: campaign.status,
            total: totalLeads || 0,
            processed: processedLeads || 0,
            percentage: totalLeads > 0 ? Math.round((processedLeads / totalLeads) * 100) : 0
        })

    } catch (e) {
        console.error('campaign progress error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
