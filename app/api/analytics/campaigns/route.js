import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/campaigns
 * Returns campaign performance metrics using updated schema
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

        // 1. Fetch campaigns
        // We select the campaigns for this org
        const { data: campaignsRaw, error } = await adminClient
            .from('campaigns')
            .select(`
                id,
                name,
                status,
                created_at,
                project:projects (
                    id,
                    name
                )
            `)
            .eq('organization_id', profile.organization_id)

        if (error) throw error
        const campaigns = campaignsRaw || []
        const campaignIds = campaigns.map(c => c.id)

        // 2. Fetch Aggregated Call Stats from Call Logs
        // We will fetch all call logs for these campaigns and aggregate manually in JS
        // (Supabase/PostgREST doesn't support complex group by aggregations easily in one go without RPC)

        let callLogStats = {}

        if (campaignIds.length > 0) {
            const { data: callLogs } = await adminClient
                .from('call_logs')
                .select('campaign_id, transferred')
                .in('campaign_id', campaignIds)

            // Aggregate
            callLogs?.forEach(log => {
                if (!callLogStats[log.campaign_id]) {
                    callLogStats[log.campaign_id] = {
                        totalCalls: 0,
                        transferredCalls: 0
                    }
                }

                callLogStats[log.campaign_id].totalCalls++
                if (log.transferred) {
                    callLogStats[log.campaign_id].transferredCalls++
                }
            })
        }

        // 3. Map stats to campaigns
        const campaignsWithStats = campaigns.map(campaign => {
            const stats = callLogStats[campaign.id] || { totalCalls: 0, transferredCalls: 0 }

            const conversionRate = stats.totalCalls > 0
                ? ((stats.transferredCalls / stats.totalCalls) * 100).toFixed(1)
                : 0

            return {
                ...campaign,
                total_calls: stats.totalCalls,
                transferred_calls: stats.transferredCalls,
                conversion_rate: conversionRate
            }
        })

        // Sort by conversion rate descending
        campaignsWithStats.sort((a, b) => parseFloat(b.conversion_rate) - parseFloat(a.conversion_rate))

        return corsJSON({ campaigns: campaignsWithStats })
    } catch (e) {
        console.error('analytics campaigns error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
