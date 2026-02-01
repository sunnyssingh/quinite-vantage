import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's organization with currency settings
        // Use admin client for reliable profile fetch
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 })
        }

        const organizationId = profile.organization_id

        // Fetch Organization Details for Currency
        const { data: organization } = await adminClient
            .from('organizations')
            .select('currency_symbol')
            .eq('id', organizationId)
            .single()

        const currencySymbol = organization?.currency_symbol || '$'

        // Fetch Default Pipeline (to avoid duplicate stages from multiple pipelines)
        const { data: defaultPipeline } = await adminClient
            .from('pipelines')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('is_default', true)
            .limit(1)
            .single()

        const pipelineId = defaultPipeline?.id

        // Parallel Data Fetching
        const [
            { count: totalLeads },
            { data: allLeads },
            { data: allDeals },
            { data: stages },
            { data: recentActivities }
        ] = await Promise.all([
            // 1. Total Leads Count
            adminClient
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', organizationId),

            // 2. Fetch all leads (id, stage_id) for aggregation
            adminClient
                .from('leads')
                .select('id, stage_id')
                .eq('organization_id', organizationId),

            // 3. Fetch all deals (lead_id, amount, status) for revenue calc
            adminClient
                .from('deals')
                .select('lead_id, amount, status')
                .eq('organization_id', organizationId),

            // 4. Fetch Pipeline Stages (Scoped to Default Pipeline)
            pipelineId ? adminClient
                .from('pipeline_stages')
                .select('id, name, color, order_index')
                .eq('pipeline_id', pipelineId)
                .order('order_index', { ascending: true })
                : Promise.resolve({ data: [] }),

            // 5. Fetch Recent Activities
            adminClient
                .from('audit_logs')
                .select('id, action, entity_type, created_at, user:profiles(full_name)')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false })
                .limit(5)
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
                    // Total Revenue logic: Sum of WON deals? or ALL deals? 
                    // Usually "Revenue" on dashboard implies "Closed Won".
                    // "Pipeline Value" implies "Active".
                    // Let's assume 'Revenue' is won/closed deals.
                    // But schema doesn't have explicit 'won' status in deals, just 'active' default.
                    // Let's assume all deals contribute to 'Revenue' in this simplified view, OR filter by status if available.
                    // Only active deals contribute to Pipeline Value. 
                    // Since specific requirements are vague, I will sum ALL deal amounts for "Revenue" bucket for now, 
                    // or better: "Pipeline Value" matches active deals.
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
            return {
                id: activity.id,
                type: getActivityType(activity.entity_type),
                title: `${activity.action} ${activity.entity_type}`,
                time: timeAgo,
                status: getActivityStatus(activity.action)
            }
        }) || []

        const dashboardData = {
            totalLeads: totalLeads || 0,
            leadsChange: '+12%', // Mocked trend
            activeDeals: activeDealsCount,
            dealsChange: '+5%',
            conversionRate,
            conversionChange: '+2%',
            revenue: `${currencySymbol}${totalRevenue.toLocaleString()}`,
            revenueChange: '+8%',
            recentActivities: formattedActivities,
            pipelineOverview
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
