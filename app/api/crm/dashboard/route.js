import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserDashboardPermissions } from '@/lib/dashboardPermissions'

export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Fetch Parallel Configuration Data (Profile, Org, Pipeline, Permissions)
        const adminClient = createAdminClient()

        // Use Promise.all for independent configuration fetches
        // We need organization_id first, so we fetch profile.
        // Optimally, we could cache this or use a session claim but let's stick to DB for reliability.
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 })
        }

        const organizationId = profile.organization_id

        // Now run organization-dependent config fetches in parallel
        const [
            permissions,
            { data: organization },
            { data: defaultPipeline }
        ] = await Promise.all([
            getUserDashboardPermissions(user.id),
            adminClient
                .from('organizations')
                .select('currency_symbol')
                .eq('id', organizationId)
                .single(),
            adminClient
                .from('pipelines')
                .select('id')
                .eq('organization_id', organizationId)
                .eq('is_default', true)
                .limit(1)
                .single()
        ])

        const canViewAllLeads = permissions.includes('view_all_leads')
        const canViewTeamLeads = permissions.includes('view_team_leads')
        const canViewOwnLeads = permissions.includes('view_own_leads')
        const canViewSettings = permissions.includes('view_settings') || permissions.includes('view_organization_settings')
        const canViewAnalytics = permissions.includes('view_organization_analytics') || permissions.includes('view_team_analytics') || permissions.includes('view_own_analytics')

        const leadsFilter = (query) => {
            if (canViewAllLeads) return query
            if (canViewTeamLeads) return query
            if (canViewOwnLeads) return query.eq('assigned_to_user_id', user.id)
            return query.eq('id', -1)
        }

        // We don't need tasksFilter for counts if we build the query directly

        const currencySymbol = organization?.currency_symbol || '$'
        const pipelineId = defaultPipeline?.id

        // Extract date range parameter
        const { searchParams } = new URL(request.url)
        const range = searchParams.get('range') || 'this_month'
        const { startDate, endDate } = getDateRange(range)

        // 2. Fetch Dashboard Data Parallelized
        const [
            { count: totalLeads },
            { data: allLeads },
            { data: allDeals },
            { data: stages },
            { data: recentActivities },
            { count: tasksCompleted },
            { count: tasksPending },
            { count: tasksOverdue }
        ] = await Promise.all([
            // 1. Total Leads Count
            leadsFilter(adminClient
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', organizationId)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())),

            // 2. Fetch all leads for aggregation
            leadsFilter(adminClient
                .from('leads')
                .select('id, stage_id')
                .eq('organization_id', organizationId)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())),

            // 3. Fetch all deals for revenue
            canViewAnalytics ? adminClient
                .from('deals')
                .select('lead_id, amount, status')
                .eq('organization_id', organizationId)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                : Promise.resolve({ data: [] }),

            // 4. Pipeline Stages
            (pipelineId && (canViewAllLeads || canViewOwnLeads)) ? adminClient
                .from('pipeline_stages')
                .select('id, name, color, order_index')
                .eq('pipeline_id', pipelineId)
                .order('order_index', { ascending: true })
                : Promise.resolve({ data: [] }),

            // 5. Recent Activities
            canViewSettings ? adminClient
                .from('audit_logs')
                .select('id, action, entity_type, created_at, user_name')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false })
                .limit(5)
                : Promise.resolve({ data: [] }),

            // 6. Tasks Completed (Optimized Count)
            adminClient
                .from('lead_tasks')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', organizationId)
                .eq('status', 'completed'),

            // 7. Tasks Pending (Optimized Count)
            adminClient
                .from('lead_tasks')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', organizationId)
                .eq('status', 'pending'),

            // 8. Tasks Overdue (Optimized Count)
            adminClient
                .from('lead_tasks')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', organizationId)
                .neq('status', 'completed')
                .lt('due_date', new Date().toISOString())
        ])

        // Aggregation Logic
        const stageMap = {}
        const pipelineOverview = []
        let activeDealsCount = 0
        let totalRevenue = 0

        // Map deals to leads for easy lookup
        const leadDealValueMap = {}
        if (allDeals) {
            allDeals.forEach(deal => {
                if (deal.amount) {
                    leadDealValueMap[deal.lead_id] = (leadDealValueMap[deal.lead_id] || 0) + Number(deal.amount)
                    totalRevenue += Number(deal.amount)
                }
            })
        }

        // Initialize counts for all stages
        if (stages) {
            stages.forEach(stage => {
                stageMap[stage.id] = { ...stage, count: 0, value: 0 }
            })
        }

        // Count leads per stage
        if (allLeads) {
            allLeads.forEach(lead => {
                const dealValue = leadDealValueMap[lead.id] || 0

                if (lead.stage_id && stageMap[lead.stage_id]) {
                    stageMap[lead.stage_id].count++
                    stageMap[lead.stage_id].value += dealValue
                }

                // Active Deals: non-archived leads
                const stageName = stageMap[lead.stage_id]?.name?.toLowerCase() || ''
                if (!stageName.includes('lost') && !stageName.includes('won') && !stageName.includes('archive')) {
                    activeDealsCount++
                }
            })
        }

        // Format Pipeline Overview
        if (stages) {
            stages.forEach(stage => {
                const info = stageMap[stage.id]
                pipelineOverview.push({
                    stage: info.name,
                    count: info.count,
                    value: `${currencySymbol}${info.value.toLocaleString()}`,
                    color: info.color || 'bg-blue-500' // fallback color
                })
            })
        }

        // Calculate Conversion Rate
        let wonCount = 0
        if (allLeads) {
            wonCount = allLeads.filter(l => {
                const sName = stageMap[l.stage_id]?.name?.toLowerCase() || ''
                return sName.includes('won') || sName.includes('closed')
            }).length
        }
        const conversionRate = totalLeads > 0
            ? ((wonCount / totalLeads) * 100).toFixed(1) + '%'
            : '0%'

        // Format activities
        const formattedActivities = recentActivities?.map(activity => {
            const timeAgo = getTimeAgo(new Date(activity.created_at))

            // Extract action verb
            let action = activity.action?.toLowerCase() || 'updated'
            if (action.includes('create')) action = 'created'
            else if (action.includes('update')) action = 'updated'
            else if (action.includes('delete')) action = 'deleted'

            // Get entity and user
            const entity = activity.entity_type?.toLowerCase() || 'item'
            const userName = activity.user_name || 'Someone'

            // Create user-friendly title
            let title = ''
            if (action === 'created') {
                title = `${userName} created a new ${entity}`
            } else if (action === 'updated') {
                title = `${userName} updated ${entity}`
            } else if (action === 'deleted') {
                title = `${userName} deleted ${entity}`
            } else {
                title = `${userName} ${action} ${entity}`
            }

            return {
                id: activity.id,
                type: getActivityType(activity.entity_type),
                title: title,
                time: timeAgo,
                status: getActivityStatus(activity.action)
            }
        }) || []

        const dashboardData = {
            totalLeads: totalLeads || 0,
            leadsChange: null,
            activeDeals: activeDealsCount,
            dealsChange: null,
            conversionRate,
            conversionChange: null,
            revenue: `${currencySymbol}${totalRevenue.toLocaleString()}`,
            revenueChange: null,
            recentActivities: formattedActivities,
            pipelineOverview,
            tasksCompleted: tasksCompleted || 0,
            tasksPending: tasksPending || 0,
            tasksOverdue: tasksOverdue || 0
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

function getDateRange(range) {
    const now = new Date()
    const startDate = new Date()
    const endDate = new Date()

    switch (range) {
        case 'this_month':
            startDate.setDate(1)
            startDate.setHours(0, 0, 0, 0)
            endDate.setHours(23, 59, 59, 999)
            break

        case 'last_month':
            startDate.setMonth(now.getMonth() - 1)
            startDate.setDate(1)
            startDate.setHours(0, 0, 0, 0)
            endDate.setMonth(now.getMonth())
            endDate.setDate(0) // Last day of previous month
            endDate.setHours(23, 59, 59, 999)
            break

        case 'this_quarter':
            const currentQuarter = Math.floor(now.getMonth() / 3)
            startDate.setMonth(currentQuarter * 3)
            startDate.setDate(1)
            startDate.setHours(0, 0, 0, 0)
            endDate.setHours(23, 59, 59, 999)
            break

        case 'last_quarter':
            const lastQuarter = Math.floor(now.getMonth() / 3) - 1
            const lastQuarterYear = lastQuarter < 0 ? now.getFullYear() - 1 : now.getFullYear()
            const lastQuarterMonth = lastQuarter < 0 ? 9 : lastQuarter * 3
            startDate.setFullYear(lastQuarterYear)
            startDate.setMonth(lastQuarterMonth)
            startDate.setDate(1)
            startDate.setHours(0, 0, 0, 0)
            endDate.setFullYear(lastQuarterYear)
            endDate.setMonth(lastQuarterMonth + 3)
            endDate.setDate(0) // Last day of quarter
            endDate.setHours(23, 59, 59, 999)
            break

        case 'this_year':
            startDate.setMonth(0)
            startDate.setDate(1)
            startDate.setHours(0, 0, 0, 0)
            endDate.setHours(23, 59, 59, 999)
            break

        case 'all_time':
        default:
            startDate.setFullYear(2000, 0, 1) // Set to a very old date
            startDate.setHours(0, 0, 0, 0)
            endDate.setHours(23, 59, 59, 999)
            break
    }

    return { startDate, endDate }
}
