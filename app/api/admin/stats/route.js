import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
        const [
            usersNow, usersPast,
            projectsNow, projectsPast,
            leadsNow, leadsPast,
            campaignsNow, campaignsPast
        ] = await Promise.all([
            getCount('profiles'), getPastCount('profiles', dateStr),
            getCount('projects'), getPastCount('projects', dateStr),
            getCount('leads'), getPastCount('leads', dateStr),
            getCount('campaigns', { status: 'active' }), getPastCount('campaigns', dateStr, { status: 'active' })
        ])

        return NextResponse.json({
            users: {
                value: usersNow,
                trend: calculateTrend(usersNow, usersPast)
            },
            projects: {
                value: projectsNow,
                trend: calculateTrend(projectsNow, projectsPast)
            },
            leads: {
                value: leadsNow,
                trend: calculateTrend(leadsNow, leadsPast)
            },
            activeCampaigns: {
                value: campaignsNow,
                trend: calculateTrend(campaignsNow, campaignsPast)
            }
        })

    } catch (error) {
        console.error('Admin stats error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
