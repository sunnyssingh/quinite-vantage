import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasPermission } from '@/lib/permissions'
import { corsJSON } from '@/lib/cors'

/**
 * GET /api/analytics/overview
 * Returns dashboard overview statistics
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
        const orgFilter = profile.is_platform_admin ? {} : { organization_id: profile.organization_id }

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
            .match({ ...orgFilter, transferred: true })

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
