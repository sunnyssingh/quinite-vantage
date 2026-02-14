
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { withPermission } from '@/lib/middleware/withAuth'
import { DealService } from '@/services/deal.service'

/**
 * POST /api/deals
 * Create a new deal
 */
export const POST = withPermission('create_deals', async (request, context) => {
    try {
        const { user, profile } = context
        const body = await request.json()
        const { lead_id, property_id, project_id, amount, status, close_date, title, name } = body

        if (!lead_id) {
            return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
        }

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        const dealData = {
            lead_id,
            status: status || 'active',
            amount: amount ? parseFloat(amount) : null,
            name: title || name
        }

        if (property_id) dealData.property_id = property_id
        if (project_id) dealData.project_id = project_id
        if (close_date) dealData.close_date = close_date

        // Create deal using service
        const deal = await DealService.createDeal(dealData, profile.organization_id, user.id)

        // Sync Lead's Property/Project with the new Deal
        const adminClient = createAdminClient()
        const leadUpdate = {}

        if (property_id) {
            leadUpdate.property_id = property_id
            // Fetch project_id for the property to keep lead consistent
            const { data: propData } = await adminClient
                .from('properties')
                .select('project_id')
                .eq('id', property_id)
                .single()
            if (propData?.project_id) leadUpdate.project_id = propData.project_id
        } else if (project_id) {
            leadUpdate.project_id = project_id
        }

        if (Object.keys(leadUpdate).length > 0) {
            await adminClient
                .from('leads')
                .update(leadUpdate)
                .eq('id', lead_id)
        }

        return NextResponse.json({ deal })

    } catch (error) {
        console.error('Error in deals POST:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
})
