import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasDashboardPermission } from '@/lib/dashboardPermissions'

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient()
        const adminClient = createAdminClient()

        // 1. Get current user profile and organization
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Use adminClient for data fetching to avoid RLS recursion issues on profiles table
        const { data: profile, error: profileError } = await adminClient
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (profileError || !profile?.organization_id) {
            console.error('Stats API: Profile error', profileError)
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        const orgId = profile.organization_id

        // 2. Calculate date for trend comparison (30 days ago)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const dateStr = thirtyDaysAgo.toISOString()

        // 3. Helper to get clean count using adminClient
        const getCount = async (table, filters = {}) => {
            let query = adminClient.from(table).select('*', { count: 'exact', head: true }).eq('organization_id', orgId)
            Object.entries(filters).forEach(([col, val]) => {
                query = query.eq(col, val)
            })
            const { count } = await query
            return count || 0
        }

        // 4. Helper to get count before date using adminClient
        const getPastCount = async (table, date, filters = {}) => {
            let query = adminClient.from(table).select('*', { count: 'exact', head: true })
                .eq('organization_id', orgId)
                .lt('created_at', date)

            Object.entries(filters).forEach(([col, val]) => {
                query = query.eq(col, val)
            })
            const { count } = await query
            return count || 0
        }

        const calculateTrend = (current, past) => {
            if (past === 0) return current > 0 ? 100 : 0
            return Math.round(((current - past) / past) * 100)
        }

        // Run queries in parallel
        // Check permissions
        const [canViewUsers, canViewProjects, canViewLeads, canViewCampaigns] = await Promise.all([
            hasDashboardPermission(user.id, 'view_users'),
            hasDashboardPermission(user.id, 'view_projects'),
            hasDashboardPermission(user.id, 'view_all_leads'), // Strict check for Org stats
            hasDashboardPermission(user.id, 'view_campaigns')
        ])

        // Run queries in parallel ONLY if permitted
        const [
            usersNow, usersPast,
            projectsNow, projectsPast,
            leadsNow, leadsPast,
            campaignsNow, campaignsPast
        ] = await Promise.all([
            canViewUsers ? getCount('profiles') : 0,
            canViewUsers ? getPastCount('profiles', dateStr) : 0,
            canViewProjects ? getCount('projects') : 0,
            canViewProjects ? getPastCount('projects', dateStr) : 0,
            canViewLeads ? getCount('leads') : 0,
            canViewLeads ? getPastCount('leads', dateStr) : 0,
            canViewCampaigns ? getCount('campaigns') : 0,
            canViewCampaigns ? getPastCount('campaigns', dateStr) : 0
        ])

        return NextResponse.json({
            users: canViewUsers ? {
                value: usersNow,
                trend: calculateTrend(usersNow, usersPast)
            } : null,
            projects: canViewProjects ? {
                value: projectsNow,
                trend: calculateTrend(projectsNow, projectsPast)
            } : null,
            leads: canViewLeads ? {
                value: leadsNow,
                trend: calculateTrend(leadsNow, leadsPast)
            } : null,
            activeCampaigns: canViewCampaigns ? {
                value: campaignsNow,
                trend: calculateTrend(campaignsNow, campaignsPast)
            } : null
        })

    } catch (error) {
        console.error('Admin stats error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
