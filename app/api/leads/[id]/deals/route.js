import { NextResponse } from 'next/server'
import { withPermission } from '@/lib/middleware/withAuth'
import { DealService } from '@/services/deal.service'
import { createAdminClient } from '@/lib/supabase/admin'

async function enrichDealsWithProfiles(deals) {
    if (!deals.length) return deals
    const userIds = [...new Set([
        ...deals.map(d => d.created_by).filter(Boolean),
        ...deals.map(d => d.updated_by).filter(Boolean),
    ])]
    if (!userIds.length) return deals
    const adminClient = createAdminClient()
    const { data: profiles } = await adminClient
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds)
    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]))
    return deals.map(d => ({
        ...d,
        createdByProfile: d.created_by ? profileMap[d.created_by] ?? null : null,
        updatedByProfile: d.updated_by ? profileMap[d.updated_by] ?? null : null,
    }))
}

/**
 * GET /api/leads/[id]/deals
 * Returns all deals for a lead, ordered by status priority, with creator/updater profiles.
 */
export const GET = withPermission('view_deals', async (request, context) => {
    try {
        const { profile } = context
        const { id: leadId } = await context.params

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        const deals = await DealService.getDealsByLead(leadId, profile.organization_id)
        const enriched = await enrichDealsWithProfiles(deals)
        return NextResponse.json({ deals: enriched })
    } catch (error) {
        console.error('Error fetching lead deals:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
})
