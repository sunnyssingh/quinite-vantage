import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Call Log Service
 * Centralized business logic for call log operations
 */
export class CallLogService {
    /**
     * Get call logs for organization
     */
    static async getCallLogs(organizationId, filters = {}) {
        const adminClient = createAdminClient()

        let query = adminClient
            .from('call_logs')
            .select(`
                *,
                lead:leads(id, name, email, phone),
                campaign:campaigns(id, name)
            `)
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })

        if (filters.campaignId) {
            query = query.eq('campaign_id', filters.campaignId)
        }

        if (filters.leadId) {
            query = query.eq('lead_id', filters.leadId)
        }

        if (filters.callStatus) {
            query = query.eq('call_status', filters.callStatus)
        }

        if (filters.transferred !== undefined) {
            query = query.eq('transferred', filters.transferred)
        }

        if (filters.limit) {
            query = query.limit(filters.limit)
        }

        const { data: callLogs, error } = await query

        if (error) throw error

        return callLogs || []
    }

    /**
     * Get single call log by ID
     */
    static async getCallLogById(callLogId, organizationId) {
        const adminClient = createAdminClient()

        const { data: callLog, error } = await adminClient
            .from('call_logs')
            .select(`
                *,
                lead:leads(id, name, email, phone, avatar_url),
                campaign:campaigns(id, name)
            `)
            .eq('id', callLogId)
            .eq('organization_id', organizationId)
            .single()

        if (error) throw error

        return callLog
    }

    /**
     * Create a new call log
     */
    static async createCallLog(callLogData, organizationId) {
        const adminClient = createAdminClient()

        const insertData = {
            ...callLogData,
            organization_id: organizationId,
            created_at: new Date().toISOString()
        }

        const { data: callLog, error } = await adminClient
            .from('call_logs')
            .insert(insertData)
            .select()
            .single()

        if (error) throw error

        return callLog
    }

    /**
     * Update a call log
     */
    static async updateCallLog(callLogId, updates, organizationId) {
        const adminClient = createAdminClient()

        const { data: callLog, error } = await adminClient
            .from('call_logs')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', callLogId)
            .eq('organization_id', organizationId)
            .select()
            .single()

        if (error) throw error

        return callLog
    }

    /**
     * Get call statistics for organization
     */
    static async getCallStats(organizationId, filters = {}) {
        const adminClient = createAdminClient()

        let query = adminClient
            .from('call_logs')
            .select('call_status, transferred, duration')
            .eq('organization_id', organizationId)

        if (filters.campaignId) {
            query = query.eq('campaign_id', filters.campaignId)
        }

        if (filters.startDate) {
            query = query.gte('created_at', filters.startDate)
        }

        if (filters.endDate) {
            query = query.lte('created_at', filters.endDate)
        }

        const { data: callLogs, error } = await query

        if (error) throw error

        const stats = {
            totalCalls: callLogs?.length || 0,
            transferred: callLogs?.filter(log => log.transferred).length || 0,
            completed: callLogs?.filter(log => log.call_status === 'completed').length || 0,
            noAnswer: callLogs?.filter(log => log.call_status === 'no_answer').length || 0,
            failed: callLogs?.filter(log => log.call_status === 'failed').length || 0,
            busy: callLogs?.filter(log => log.call_status === 'busy').length || 0,
            avgDuration: callLogs?.length > 0
                ? callLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / callLogs.length
                : 0,
            conversionRate: callLogs?.length > 0
                ? (callLogs.filter(log => log.transferred).length / callLogs.length) * 100
                : 0
        }

        return stats
    }

    /**
     * Get call logs for a specific lead
     */
    static async getCallLogsByLead(leadId, organizationId) {
        const adminClient = createAdminClient()

        const { data: callLogs, error } = await adminClient
            .from('call_logs')
            .select('*')
            .eq('lead_id', leadId)
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return callLogs || []
    }
}
