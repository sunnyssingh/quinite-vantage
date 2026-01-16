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

        // 1. Fetch campaigns
        let query = adminClient
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

        // Filter by organization
        if (!profile.is_platform_admin) {
            query = query.eq('organization_id', profile.organization_id)
        }

        const { data: campaignsRaw, error } = await query
        if (error) throw error

        const campaigns = campaignsRaw || []

        // 2. Fetch leads for these campaigns to calculate stats
        // Leads are linked to projects, not directly to campaigns (unless via call_log, but we use leads table for reliability)
        const projectIds = campaigns.map(c => c.project?.id).filter(Boolean)

        let leads = []
        if (projectIds.length > 0) {
            const { data: leadsData } = await adminClient
                .from('leads')
                .select('project_id, call_status, transferred_to_human')
                .in('project_id', projectIds)
            leads = leadsData || []
        }

        // 3. Aggregate stats
        const campaignsWithStats = campaigns.map(campaign => {
            // Find leads belonging to this campaign's project
            const campaignLeads = leads.filter(l => l.project_id === campaign.project?.id)

            // Count calls: any lead that has a call_status other than null/not_called
            const totalCalls = campaignLeads.filter(l => l.call_status && l.call_status !== 'not_called').length

            // Count transfers
            const transferredCalls = campaignLeads.filter(l => l.transferred_to_human === true).length

            const conversionRate = totalCalls > 0 ? ((transferredCalls / totalCalls) * 100).toFixed(1) : 0

            return {
                ...campaign,
                total_calls: totalCalls,
                transferred_calls: transferredCalls,
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
