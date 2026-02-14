import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'
import { withAuth } from '@/lib/middleware/withAuth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/overview
 * Returns dashboard overview statistics using updated schema
 */
export const GET = withAuth(async (request, context) => {
    try {
        const { user, profile } = context

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        const adminClient = createAdminClient()
        const orgFilter = { organization_id: profile.organization_id }

        // 1. Get total leads count
        const { count: totalLeads } = await adminClient
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .match(orgFilter)

        // 2. Get Lead Status Distribution (using pipeline_stages)
        // First fetch all stages
        const { data: textStages } = await adminClient
            .from('pipeline_stages')
            .select('id, name')

        // Get leads grouped by stage_id
        const { data: leadsWithStages } = await adminClient
            .from('leads')
            .select('stage_id')
            .match(orgFilter)

        const statusCounts = {}
        // Initialize dynamic status counts
        textStages?.forEach(stage => {
            statusCounts[stage.name] = 0
        })
        statusCounts['Unknown'] = 0

        leadsWithStages?.forEach(lead => {
            if (lead.stage_id) {
                const stage = textStages?.find(s => s.id === lead.stage_id)
                if (stage) {
                    statusCounts[stage.name] = (statusCounts[stage.name] || 0) + 1
                } else {
                    statusCounts['Unknown']++
                }
            } else {
                statusCounts['Unknown']++
            }
        })

        // Remove 'Unknown' if 0
        if (statusCounts['Unknown'] === 0) delete statusCounts['Unknown']

        // 3. Get total campaigns
        const { count: totalCampaigns } = await adminClient
            .from('campaigns')
            .select('*', { count: 'exact', head: true })
            .match(orgFilter)

        // 4. Get Call Metrics from call_logs (ACTUAL calls made)
        const { count: totalCalls } = await adminClient
            .from('call_logs')
            .select('*', { count: 'exact', head: true })
            .match(orgFilter)

        // 5. Get Transferred calls from call_logs
        const { count: totalTransferred } = await adminClient
            .from('call_logs')
            .select('*', { count: 'exact', head: true })
            .match(orgFilter)
            .eq('transferred', true)

        const overallConversionRate = totalCalls > 0 ? (totalTransferred / totalCalls * 100).toFixed(2) : 0

        // 6. Get Call Outcome Breakdown
        const { data: callOutcomes } = await adminClient
            .from('call_logs')
            .select('call_status')
            .match(orgFilter)

        const callStatusCounts = {
            'completed': 0,
            'failed': 0,
            'busy': 0,
            'no_answer': 0,
            'queued': 0
        }

        callOutcomes?.forEach(call => {
            if (call.call_status) {
                const status = call.call_status.toLowerCase()
                callStatusCounts[status] = (callStatusCounts[status] || 0) + 1
            }
        })

        // Add queued calls count from call_queue
        const { count: queuedCount } = await adminClient
            .from('call_queue')
            .select('*', { count: 'exact', head: true })
            .match(orgFilter)
            .eq('status', 'queued')

        callStatusCounts['queued'] = queuedCount || 0

        // 7. Get Recent Activity
        // Fetch recent call logs and join with leads
        const { data: recentCalls } = await adminClient
            .from('call_logs')
            .select(`
                id,
                created_at,
                call_status,
                lead:leads(name, phone)
            `)
            .match(orgFilter)
            .order('created_at', { ascending: false })
            .limit(10)

        const recentActivity = recentCalls?.map(call => ({
            id: call.id,
            name: call.lead?.name || 'Unknown Lead',
            status: call.call_status,
            created_at: call.created_at
        })) || []

        return corsJSON({
            overview: {
                totalLeads: totalLeads || 0,
                totalCampaigns: totalCampaigns || 0,
                totalCalls: totalCalls || 0,
                totalTransferred: totalTransferred || 0,
                conversionRate: parseFloat(overallConversionRate)
            },
            leadsByStatus: statusCounts,
            callStatusCounts,
            transferredCount: totalTransferred,
            recentActivity
        })
    } catch (e) {
        console.error('analytics overview error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
})
