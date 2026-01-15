import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/overview
 * Returns dashboard overview statistics
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
        // The instruction implies that is_platform_admin is no longer used for filtering,
        // or that the profile fetching should include it.
        // Given the instruction to select only 'organization_id',
        // the orgFilter should be based solely on organization_id.
        // If platform admin functionality is still desired, the profile select needs adjustment.
        // For now, adhering strictly to the instruction's select('organization_id').
        // Assuming the intent is to filter by organization_id for all users.
        const orgFilter = { organization_id: profile.organization_id }

        // Get total leads count
        const { count: totalLeads } = await adminClient
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .match(orgFilter)

        // Get leads by status
        const { data: leadsByStatus } = await adminClient
            .from('leads')
            .select('status')
            .match(orgFilter)

        const statusCounts = {
            new: 0,
            contacted: 0,
            qualified: 0,
            converted: 0,
            lost: 0
        }

        leadsByStatus?.forEach(lead => {
            if (statusCounts.hasOwnProperty(lead.status)) {
                statusCounts[lead.status]++
            }
        })

        // Get total campaigns
        const { count: totalCampaigns } = await adminClient
            .from('campaigns')
            .select('*', { count: 'exact', head: true })
            .match(orgFilter)

        // Get total calls from call_logs
        const { count: totalCalls } = await adminClient
            .from('call_logs')
            .select('*', { count: 'exact', head: true })
            .match(orgFilter)

        // Get total transferred from call_logs
        const { count: totalTransferred } = await adminClient
            .from('call_logs')
            .select('*', { count: 'exact', head: true })
            .match({ ...orgFilter, call_status: 'transferred' })

        const overallConversionRate = totalCalls > 0 ? (totalTransferred / totalCalls * 100).toFixed(2) : 0

        // Get leads by call status

        const { data: leadsByCallStatus } = await adminClient
            .from('leads')
            .select('call_status, transferred_to_human')
            .match(orgFilter)

        const callStatusCounts = {
            not_called: 0,
            called: 0,
            transferred: 0,
            no_answer: 0,
            voicemail: 0
        }

        let transferredCount = 0
        leadsByCallStatus?.forEach(lead => {
            if (callStatusCounts.hasOwnProperty(lead.call_status)) {
                callStatusCounts[lead.call_status]++
            }
            if (lead.transferred_to_human) {
                transferredCount++
            }
        })

        // Get recent activity (last 10 leads)
        const { data: recentLeads } = await adminClient
            .from('leads')
            .select('id, name, status, call_status, created_at')
            .match(orgFilter)
            .order('created_at', { ascending: false })
            .limit(10)

        return corsJSON({
            overview: {
                totalLeads,
                totalCampaigns,
                totalCalls,
                totalTransferred,
                conversionRate: parseFloat(overallConversionRate)
            },
            leadsByStatus: statusCounts,
            callStatusCounts,
            transferredCount,
            recentActivity: recentLeads || []
        })
    } catch (e) {
        console.error('analytics overview error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
