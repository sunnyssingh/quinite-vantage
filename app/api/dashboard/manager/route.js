import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/manager
 * Returns manager-specific dashboard data including team performance
 */
export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's organization and role
        const admin = createAdminClient()
        const { data: profile } = await admin
            .from('profiles')
            .select('organization_id, role')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        // Verify manager role
        if (profile.role !== 'manager' && profile.role !== 'admin') {
            return corsJSON({ error: 'Insufficient permissions' }, { status: 403 })
        }

        const orgFilter = { organization_id: profile.organization_id }

        // Parallel data fetching for performance
        const [
            leadsResult,
            campaignsResult,
            callLogsResult,
            teamMembersResult,
            recentActivityResult,
            stagesResult
        ] = await Promise.all([
            // 1. Total leads
            admin.from('leads').select('*', { count: 'exact', head: true }).match(orgFilter),

            // 2. Active campaigns
            admin.from('campaigns').select('id, name, status, created_at').match(orgFilter).eq('status', 'active'),

            // 3. Call logs for metrics
            admin.from('call_logs').select('id, call_status, duration, transferred, created_at').match(orgFilter),

            // 4. Team members with their stats
            admin.from('profiles')
                .select('id, full_name, email, avatar_url, role, last_seen')
                .eq('organization_id', profile.organization_id)
                .in('role', ['employee', 'manager']),

            // 5. Recent activity (last 20 activities)
            admin.from('call_logs')
                .select(`
                    id,
                    created_at,
                    call_status,
                    transferred,
                    lead:leads(name, phone)
                `)
                .match(orgFilter)
                .order('created_at', { ascending: false })
                .limit(20),

            // 6. Pipeline stages for lead distribution
            admin.from('pipeline_stages').select('id, name, color')
        ])

        // Calculate overview stats
        const totalLeads = leadsResult.count || 0
        const activeCampaigns = campaignsResult.data?.length || 0
        const totalCalls = callLogsResult.data?.length || 0
        const transferredCalls = callLogsResult.data?.filter(c => c.transferred).length || 0
        const conversionRate = totalCalls > 0 ? ((transferredCalls / totalCalls) * 100).toFixed(1) : 0

        // Calculate completed calls
        const completedCalls = callLogsResult.data?.filter(c => c.call_status === 'completed').length || 0
        const callSuccessRate = totalCalls > 0 ? ((completedCalls / totalCalls) * 100).toFixed(1) : 0

        // Calculate average call duration
        const callsWithDuration = callLogsResult.data?.filter(c => c.duration) || []
        const avgCallDuration = callsWithDuration.length > 0
            ? Math.round(callsWithDuration.reduce((sum, c) => sum + c.duration, 0) / callsWithDuration.length)
            : 0

        // Get team member stats
        const teamStats = await Promise.all(
            (teamMembersResult.data || []).map(async (member) => {
                const [memberLeads, memberCalls] = await Promise.all([
                    admin.from('leads').select('id, stage_id', { count: 'exact' })
                        .eq('assigned_to', member.id)
                        .match(orgFilter),
                    admin.from('call_logs').select('id, transferred', { count: 'exact' })
                        .eq('user_id', member.id)
                        .match(orgFilter)
                ])

                const leadsCount = memberLeads.count || 0
                const callsCount = memberCalls.count || 0
                const conversions = memberCalls.data?.filter(c => c.transferred).length || 0
                const conversionRate = callsCount > 0 ? ((conversions / callsCount) * 100).toFixed(1) : 0

                return {
                    id: member.id,
                    name: member.full_name || member.email,
                    email: member.email,
                    avatar: member.avatar_url,
                    role: member.role,
                    leadsAssigned: leadsCount,
                    callsMade: callsCount,
                    conversions: conversions,
                    conversionRate: parseFloat(conversionRate),
                    lastSeen: member.last_seen,
                    isOnline: member.last_seen ? (new Date() - new Date(member.last_seen)) < 5 * 60 * 1000 : false
                }
            })
        )

        // Get lead distribution by stage
        const { data: allLeads } = await admin
            .from('leads')
            .select('stage_id')
            .match(orgFilter)

        const leadDistribution = {}
        stagesResult.data?.forEach(stage => {
            const count = allLeads?.filter(l => l.stage_id === stage.id).length || 0
            if (count > 0) {
                leadDistribution[stage.name] = {
                    count,
                    color: stage.color || '#3b82f6'
                }
            }
        })

        // Get campaign performance
        const campaignPerformance = await Promise.all(
            (campaignsResult.data || []).map(async (campaign) => {
                const [campaignLeads, campaignCalls] = await Promise.all([
                    admin.from('leads').select('id', { count: 'exact' })
                        .eq('campaign_id', campaign.id),
                    admin.from('call_logs').select('id, transferred', { count: 'exact' })
                        .eq('campaign_id', campaign.id)
                ])

                const leadsCount = campaignLeads.count || 0
                const callsCount = campaignCalls.count || 0
                const conversions = campaignCalls.data?.filter(c => c.transferred).length || 0
                const conversionRate = callsCount > 0 ? ((conversions / callsCount) * 100).toFixed(1) : 0

                return {
                    id: campaign.id,
                    name: campaign.name,
                    status: campaign.status,
                    activeLeads: leadsCount,
                    callsMade: callsCount,
                    conversions: conversions,
                    conversionRate: parseFloat(conversionRate),
                    createdAt: campaign.created_at
                }
            })
        )

        // Format recent activity
        const recentActivity = (recentActivityResult.data || []).map(activity => ({
            id: activity.id,
            type: activity.transferred ? 'transfer' : 'call',
            leadName: activity.lead?.name || 'Unknown',
            leadPhone: activity.lead?.phone,
            status: activity.call_status,
            timestamp: activity.created_at
        }))

        return corsJSON({
            overview: {
                totalLeads,
                activeCampaigns,
                conversionRate: parseFloat(conversionRate),
                totalCalls,
                callSuccessRate: parseFloat(callSuccessRate),
                avgCallDuration
            },
            teamPerformance: {
                members: teamStats,
                topPerformers: teamStats
                    .sort((a, b) => b.conversionRate - a.conversionRate)
                    .slice(0, 5)
            },
            leadDistribution,
            campaignPerformance,
            recentActivity
        })
    } catch (e) {
        console.error('Manager dashboard error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
