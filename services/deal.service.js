import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Deal Service
 * Centralized business logic for deal operations
 */
export class DealService {
    /**
     * Get deals for organization
     */
    static async getDeals(organizationId, filters = {}) {
        const adminClient = createAdminClient()

        let query = adminClient
            .from('deals')
            .select(`
                *,
                lead:leads(id, name, email, phone),
                project:projects(id, name)
            `)
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })

        if (filters.status) {
            query = query.eq('status', filters.status)
        }

        if (filters.leadId) {
            query = query.eq('lead_id', filters.leadId)
        }

        if (filters.projectId) {
            query = query.eq('project_id', filters.projectId)
        }

        const { data: deals, error } = await query

        if (error) throw error

        return deals || []
    }

    /**
     * Get single deal by ID
     */
    static async getDealById(dealId, organizationId) {
        const adminClient = createAdminClient()

        const { data: deal, error } = await adminClient
            .from('deals')
            .select(`
                *,
                lead:leads(id, name, email, phone, avatar_url),
                project:projects(id, name)
            `)
            .eq('id', dealId)
            .eq('organization_id', organizationId)
            .single()

        if (error) throw error

        return deal
    }

    /**
     * Create a new deal
     */
    static async createDeal(dealData, organizationId, createdBy) {
        const adminClient = createAdminClient()

        const insertData = {
            ...dealData,
            organization_id: organizationId,
            created_by: createdBy,
            status: dealData.status || 'open',
            created_at: new Date().toISOString()
        }

        const { data: deal, error } = await adminClient
            .from('deals')
            .insert(insertData)
            .select()
            .single()

        if (error) throw error

        return deal
    }

    /**
     * Update a deal
     */
    static async updateDeal(dealId, updates, organizationId) {
        const adminClient = createAdminClient()

        const { data: deal, error } = await adminClient
            .from('deals')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', dealId)
            .eq('organization_id', organizationId)
            .select()
            .single()

        if (error) throw error

        return deal
    }

    /**
     * Delete a deal
     */
    static async deleteDeal(dealId, organizationId) {
        const adminClient = createAdminClient()

        const { error } = await adminClient
            .from('deals')
            .delete()
            .eq('id', dealId)
            .eq('organization_id', organizationId)

        if (error) throw error

        return true
    }

    /**
     * Update deal status
     */
    static async updateDealStatus(dealId, status, organizationId) {
        return this.updateDeal(dealId, { status }, organizationId)
    }

    /**
     * Get deal statistics for organization
     */
    static async getDealStats(organizationId) {
        const adminClient = createAdminClient()

        const { data: deals, error } = await adminClient
            .from('deals')
            .select('status, amount')
            .eq('organization_id', organizationId)

        if (error) throw error

        const stats = {
            total: deals?.length || 0,
            open: deals?.filter(d => d.status === 'open').length || 0,
            won: deals?.filter(d => d.status === 'won').length || 0,
            lost: deals?.filter(d => d.status === 'lost').length || 0,
            totalValue: deals?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0,
            wonValue: deals?.filter(d => d.status === 'won').reduce((sum, d) => sum + (d.amount || 0), 0) || 0
        }

        return stats
    }
}
