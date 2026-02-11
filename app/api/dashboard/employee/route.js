import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/employee
 * Returns employee-specific dashboard data including personal stats and assigned leads
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
            .select('organization_id, role, full_name')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        const orgFilter = { organization_id: profile.organization_id }
        const userId = user.id

        // Get today's date range
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayISO = today.toISOString()

        // Parallel data fetching for performance
        const [
            myLeadsResult,
            myCallsResult,
            myCallsTodayResult,
            myRecentCallsResult,
            stagesResult
        ] = await Promise.all([
            // 1. My assigned leads
            admin.from('leads')
                .select(`
                    id,
                    name,
                    phone,
                    email,
                    stage_id,
                    last_contacted,
                    created_at,
                    pipeline_stages(name, color)
                `)
                .eq('assigned_to', userId)
                .match(orgFilter)
                .order('last_contacted', { ascending: true, nullsFirst: true })
                .limit(50),

            // 2. All my calls for conversion rate
            admin.from('call_logs')
                .select('id, transferred, call_status, duration')
                .eq('user_id', userId)
                .match(orgFilter),

            // 3. My calls today
            admin.from('call_logs')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId)
                .match(orgFilter)
                .gte('created_at', todayISO),

            // 4. My recent calls with details
            admin.from('call_logs')
                .select(`
                    id,
                    created_at,
                    call_status,
                    duration,
                    transferred,
                    notes,
                    lead:leads(id, name, phone)
                `)
                .eq('user_id', userId)
                .match(orgFilter)
                .order('created_at', { ascending: false })
                .limit(10),

            // 5. Pipeline stages
            admin.from('pipeline_stages').select('id, name, color')
        ])

        // Calculate personal stats
        const myLeads = myLeadsResult.data || []
        const totalLeads = myLeads.length

        const allCalls = myCallsResult.data || []
        const totalCalls = allCalls.length
        const completedCalls = allCalls.filter(c => c.call_status === 'completed').length
        const transferredCalls = allCalls.filter(c => c.transferred).length

        const callsToday = myCallsTodayResult.count || 0

        // Calculate conversion rate
        const conversionRate = totalCalls > 0 ? ((transferredCalls / totalCalls) * 100).toFixed(1) : 0

        // Calculate average call duration
        const callsWithDuration = allCalls.filter(c => c.duration && c.duration > 0)
        const avgCallDuration = callsWithDuration.length > 0
            ? Math.round(callsWithDuration.reduce((sum, c) => sum + c.duration, 0) / callsWithDuration.length)
            : 0

        // Get this week's conversions
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const { count: conversionsThisWeek } = await admin
            .from('call_logs')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('transferred', true)
            .match(orgFilter)
            .gte('created_at', weekAgo.toISOString())

        // Categorize leads by priority
        const highPriorityLeads = myLeads.filter(lead => {
            if (!lead.last_contacted) return true // Never contacted
            const daysSinceContact = (new Date() - new Date(lead.last_contacted)) / (1000 * 60 * 60 * 24)
            return daysSinceContact > 3 // Not contacted in 3+ days
        }).slice(0, 10)

        // Get tasks/pending actions (leads that need follow-up)
        const pendingTasks = myLeads.filter(lead => {
            if (!lead.last_contacted) return false
            const daysSinceContact = (new Date() - new Date(lead.last_contacted)) / (1000 * 60 * 60 * 24)
            return daysSinceContact >= 1 && daysSinceContact <= 3 // Follow-up window
        }).map(lead => ({
            id: lead.id,
            type: 'follow_up',
            leadName: lead.name,
            leadPhone: lead.phone,
            dueDate: lead.last_contacted,
            priority: 'medium'
        }))

        // Format assigned leads
        const assignedLeads = highPriorityLeads.map(lead => ({
            id: lead.id,
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            status: lead.pipeline_stages?.name || 'New',
            statusColor: lead.pipeline_stages?.color || '#3b82f6',
            lastContacted: lead.last_contacted,
            daysSinceContact: lead.last_contacted
                ? Math.floor((new Date() - new Date(lead.last_contacted)) / (1000 * 60 * 60 * 24))
                : null,
            priority: !lead.last_contacted ? 'high' : 'medium'
        }))

        // Format recent calls
        const recentCalls = (myRecentCallsResult.data || []).map(call => ({
            id: call.id,
            leadName: call.lead?.name || 'Unknown',
            leadPhone: call.lead?.phone,
            leadId: call.lead?.id,
            status: call.call_status,
            duration: call.duration,
            transferred: call.transferred,
            notes: call.notes,
            timestamp: call.created_at
        }))

        // Get performance trend (last 7 days)
        const performanceTrend = []
        for (let i = 6; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            date.setHours(0, 0, 0, 0)
            const nextDate = new Date(date)
            nextDate.setDate(nextDate.getDate() + 1)

            const { data: dayCalls } = await admin
                .from('call_logs')
                .select('id, transferred')
                .eq('user_id', userId)
                .match(orgFilter)
                .gte('created_at', date.toISOString())
                .lt('created_at', nextDate.toISOString())

            performanceTrend.push({
                date: date.toISOString().split('T')[0],
                calls: dayCalls?.length || 0,
                conversions: dayCalls?.filter(c => c.transferred).length || 0
            })
        }

        return corsJSON({
            overview: {
                myLeads: totalLeads,
                callsToday,
                conversionsThisWeek: conversionsThisWeek || 0,
                pendingTasks: pendingTasks.length,
                conversionRate: parseFloat(conversionRate),
                avgCallDuration
            },
            assignedLeads,
            tasks: pendingTasks,
            recentCalls,
            performanceTrend
        })
    } catch (e) {
        console.error('Employee dashboard error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
