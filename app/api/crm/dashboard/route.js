import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's organization
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 })
        }

        const organizationId = profile.organization_id

        // Fetch total leads
        const { count: totalLeads } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)

        // Fetch active deals (projects with status not 'completed' or 'cancelled')
        const { count: activeDeals } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .not('status', 'in', '(completed,cancelled)')

        // Fetch active campaigns
        const { count: activeCampaigns } = await supabase
            .from('campaigns')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('status', 'active')

        // Calculate conversion rate (simplified - leads to projects ratio)
        const { count: totalProjects } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)

        const conversionRate = totalLeads > 0
            ? ((totalProjects / totalLeads) * 100).toFixed(1) + '%'
            : '0%'

        // Fetch recent activities from audit logs
        const { data: recentActivities } = await supabase
            .from('audit_logs')
            .select('id, action, entity_type, created_at, user:profiles(full_name)')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
            .limit(5)

        // Format activities
        const formattedActivities = recentActivities?.map(activity => {
            const timeAgo = getTimeAgo(new Date(activity.created_at))
            return {
                id: activity.id,
                type: getActivityType(activity.entity_type),
                title: `${activity.action} ${activity.entity_type}`,
                time: timeAgo,
                status: getActivityStatus(activity.action)
            }
        }) || []

        // Mock data for demonstration (replace with real calculations)
        const dashboardData = {
            totalLeads: totalLeads || 0,
            leadsChange: '+12%', // Calculate from historical data
            activeDeals: activeDeals || 0,
            dealsChange: '+8%',
            conversionRate,
            conversionChange: '+3%',
            revenue: '$0', // Calculate from projects/deals
            revenueChange: '+15%',
            recentActivities: formattedActivities,
        }

        return NextResponse.json(dashboardData)
    } catch (error) {
        console.error('[CRM Dashboard] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    return `${Math.floor(seconds / 86400)} days ago`
}

function getActivityType(entityType) {
    const typeMap = {
        'lead': 'call',
        'campaign': 'email',
        'project': 'deal',
        'meeting': 'meeting'
    }
    return typeMap[entityType] || 'activity'
}

function getActivityStatus(action) {
    const statusMap = {
        'created': 'completed',
        'updated': 'updated',
        'deleted': 'completed',
        'sent': 'sent',
        'scheduled': 'scheduled'
    }
    return statusMap[action] || 'updated'
}
