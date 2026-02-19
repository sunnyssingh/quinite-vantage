
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

/**
 * Maps deal status → inventory property status
 */
function dealStatusToPropertyStatus(dealStatus) {
    const s = (dealStatus || '').toLowerCase()
    if (s === 'won' || s === 'closed' || s === 'closed won') return 'sold'
    if (s === 'lost') return 'available'
    return 'reserved'
}

/**
 * PATCH /api/deals/[id]
 * Update deal status and auto-sync the linked property's inventory status
 */
export async function PATCH(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminClient = createAdminClient()
        const { id } = await params
        const body = await request.json()
        const { status, amount, close_date, name } = body

        // Build update payload
        const updatePayload = { updated_at: new Date().toISOString() }
        if (status !== undefined) updatePayload.status = status
        if (amount !== undefined) updatePayload.amount = parseFloat(amount)
        if (close_date !== undefined) updatePayload.close_date = close_date
        if (name !== undefined) updatePayload.name = name

        // Fetch existing deal to get property_id and lead_id
        const { data: existingDeal, error: fetchError } = await adminClient
            .from('deals')
            .select('id, property_id, lead_id, status')
            .eq('id', id)
            .single()

        if (fetchError || !existingDeal) {
            return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
        }

        // Update the deal
        const { data: updatedDeal, error: updateError } = await adminClient
            .from('deals')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single()

        if (updateError) throw updateError

        // ✅ Auto-sync inventory property status when deal status changes
        if (status && status !== existingDeal.status && existingDeal.property_id) {
            const newPropertyStatus = dealStatusToPropertyStatus(status)

            await adminClient
                .from('properties')
                .update({ status: newPropertyStatus, updated_at: new Date().toISOString() })
                .eq('id', existingDeal.property_id)

            // If deal is lost → remove the property link from the lead
            if (newPropertyStatus === 'available' && existingDeal.lead_id) {
                await adminClient
                    .from('leads')
                    .update({ property_id: null })
                    .eq('id', existingDeal.lead_id)
                    .eq('property_id', existingDeal.property_id)
            }
        }

        return NextResponse.json({ deal: updatedDeal })

    } catch (error) {
        console.error('Error in deals PATCH:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * DELETE /api/deals/[id]
 */
export async function DELETE(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminClient = createAdminClient()
        const { id } = await params

        // Fetch the deal to get property_id before deleting
        const { data: deal } = await adminClient
            .from('deals')
            .select('property_id, lead_id')
            .eq('id', id)
            .single()

        const { error } = await adminClient
            .from('deals')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting deal:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // If the deleted deal had a property, check if any other active deals exist for it
        if (deal?.property_id) {
            const { data: remainingDeals } = await adminClient
                .from('deals')
                .select('id, status')
                .eq('property_id', deal.property_id)
                .neq('status', 'lost')

            if (!remainingDeals || remainingDeals.length === 0) {
                // No more active deals → mark property as available
                await adminClient
                    .from('properties')
                    .update({ status: 'available', updated_at: new Date().toISOString() })
                    .eq('id', deal.property_id)

                // Unlink from lead too
                if (deal.lead_id) {
                    await adminClient
                        .from('leads')
                        .update({ property_id: null })
                        .eq('id', deal.lead_id)
                        .eq('property_id', deal.property_id)
                }
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in deals DELETE:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
