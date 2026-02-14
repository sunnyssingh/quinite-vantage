import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Campaign Service
 * Centralized business logic for campaign operations
 */
export class CampaignService {
    /**
     * Get campaigns for organization
     */
    static async getCampaigns(organizationId, filters = {}) {
        const adminClient = createAdminClient()

        let query = adminClient
            .from('campaigns')
            .select(`
                *,
                project:projects(id, name)
            `, { count: 'exact' })
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })

        if (filters.status) {
            query = query.eq('status', filters.status)
        }

        if (filters.projectId) {
            query = query.eq('project_id', filters.projectId)
        }

        // Pagination
        const page = filters.page ? parseInt(filters.page) : 1
        const limit = filters.limit ? parseInt(filters.limit) : 20
        const from = (page - 1) * limit
        const to = from + limit - 1

        query = query.range(from, to)

        const { data: campaigns, error, count } = await query

        if (error) throw error

        return {
            campaigns: campaigns || [],
            metadata: {
                total: count || 0,
                page,
                limit,
                hasMore: (from + limit) < (count || 0)
            }
        }
    }

    /**
     * Get single campaign by ID
     */
    static async getCampaignById(campaignId, organizationId) {
        const adminClient = createAdminClient()

        const { data: campaign, error } = await adminClient
            .from('campaigns')
            .select(`
                *,
                project:projects(id, name),
                call_logs(id, call_status, duration, transferred)
            `)
            .eq('id', campaignId)
            .eq('organization_id', organizationId)
            .single()

        if (error) throw error

        return campaign
    }

    /**
     * Create a new campaign
     */
    static async createCampaign(campaignData, organizationId, createdBy) {
        const adminClient = createAdminClient()

        const insertData = {
            ...campaignData,
            organization_id: organizationId,
            created_by: createdBy,
            status: 'draft',
            total_calls: 0,
            transferred_calls: 0,
            conversion_rate: 0,
            created_at: new Date().toISOString()
        }

        const { data: campaign, error } = await adminClient
            .from('campaigns')
            .insert(insertData)
            .select()
            .single()

        if (error) throw error

        return campaign
    }

    /**
     * Update a campaign
     */
    static async updateCampaign(campaignId, updates, organizationId) {
        const adminClient = createAdminClient()

        const { data: campaign, error } = await adminClient
            .from('campaigns')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', campaignId)
            .eq('organization_id', organizationId)
            .select()
            .single()

        if (error) throw error

        return campaign
    }

    /**
     * Delete a campaign
     */
    static async deleteCampaign(campaignId, organizationId) {
        const adminClient = createAdminClient()

        const { error } = await adminClient
            .from('campaigns')
            .delete()
            .eq('id', campaignId)
            .eq('organization_id', organizationId)

        if (error) throw error

        return true
    }

    /**
     * Update campaign status
     */
    static async updateCampaignStatus(campaignId, status, organizationId) {
        return this.updateCampaign(campaignId, { status }, organizationId)
    }

    /**
     * Get campaign statistics
     */
    static async getCampaignStats(campaignId, organizationId) {
        const adminClient = createAdminClient()

        // Get call logs for this campaign
        const { data: callLogs, error } = await adminClient
            .from('call_logs')
            .select('call_status, transferred, duration')
            .eq('campaign_id', campaignId)

        if (error) throw error

        const stats = {
            totalCalls: callLogs?.length || 0,
            transferred: callLogs?.filter(log => log.transferred).length || 0,
            completed: callLogs?.filter(log => log.call_status === 'completed').length || 0,
            noAnswer: callLogs?.filter(log => log.call_status === 'no_answer').length || 0,
            failed: callLogs?.filter(log => log.call_status === 'failed').length || 0,
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
     * Get leads for campaign (via project)
     */
    static async getCampaignLeads(campaignId, organizationId) {
        const adminClient = createAdminClient()

        // First get campaign to find project_id
        const { data: campaign } = await adminClient
            .from('campaigns')
            .select('project_id')
            .eq('id', campaignId)
            .eq('organization_id', organizationId)
            .single()

        if (!campaign?.project_id) return []

        // Get leads for this project
        const { data: leads, error } = await adminClient
            .from('leads')
            .select('*')
            .eq('project_id', campaign.project_id)
            .eq('organization_id', organizationId)

        if (error) throw error

        return leads || []
    }
}
