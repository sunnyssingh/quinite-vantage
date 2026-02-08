import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { id } = await params

        // Get user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get lead
        const { data, error } = await supabase
            .from('leads')
            .select(`
                *,
                project:projects(id, name, image_url, address, project_type),
                deals(*)
            `)
            .eq('id', id)
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ lead: data })
    } catch (error) {
        console.error('Error fetching lead:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { id } = await params
        const body = await request.json()

        // Get user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Prepare update data
        const updateData = {}

        // Allow updating specific fields
        if (body.name !== undefined) updateData.name = body.name
        if (body.email !== undefined) updateData.email = body.email
        if (body.phone !== undefined) updateData.phone = body.phone
        if (body.stageId !== undefined) updateData.stage_id = body.stageId
        if (body.projectId !== undefined) updateData.project_id = body.projectId
        if (body.call_status !== undefined) updateData.call_status = body.call_status
        if (body.notes !== undefined) updateData.notes = body.notes
        if (body.mobile !== undefined) updateData.mobile = body.mobile
        if (body.title !== undefined) updateData.title = body.title
        if (body.department !== undefined) updateData.department = body.department
        if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url

        // Update lead
        const { data, error } = await supabase
            .from('leads')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating lead:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // [Inventory Automation] If Lead is WON, mark linked property as SOLD
        if (body.status === 'won' || body.stage === 'won' || (body.stageId && ['won', 'closed-won'].includes(body.stageId))) { // heuristic check
            // Need to fetch lead's property_id first
            const { data: leadData } = await supabase
                .from('leads')
                .select('property_id')
                .eq('id', id)
                .single()

            if (leadData?.property_id) {
                const adminClient = createAdminClient()
                await adminClient
                    .from('properties')
                    .update({ status: 'sold' })
                    .eq('id', leadData.property_id)

                console.log(`[Inventory] Auto-sold property ${leadData.property_id} for lead ${id}`)
            }
        }

        // [Schema Alignment] Update Deal if value is provided
        if (body.dealValue !== undefined) {
            const amount = parseFloat(body.dealValue)
            if (!isNaN(amount)) {
                // Check if deal exists
                const { data: existingDeal } = await supabase
                    .from('deals')
                    .select('id')
                    .eq('lead_id', id)
                    .single()

                if (existingDeal) {
                    await supabase
                        .from('deals')
                        .update({ amount })
                        .eq('id', existingDeal.id)
                } else {
                    // Get user profile for organization_id
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('organization_id')
                        .eq('id', user.id)
                        .single()

                    if (profile?.organization_id) {
                        await supabase
                            .from('deals')
                            .insert({
                                lead_id: id,
                                amount,
                                status: 'active',
                                organization_id: profile.organization_id
                            })
                    }
                }
            }
        }

        return NextResponse.json({ lead: data })
    } catch (error) {
        console.error('Error updating lead:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { id } = await params

        // Get user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Delete dependent records manually (Cascade)

        // 1. Delete call-related data (depend on call_logs and lead)
        await Promise.all([
            supabase.from('conversation_insights').delete().eq('lead_id', id),
            supabase.from('agent_calls').delete().eq('lead_id', id),
            supabase.from('call_attempts').delete().eq('lead_id', id)
        ])

        // 2. Delete call logs (depends on lead)
        await supabase.from('call_logs').delete().eq('lead_id', id)

        // 3. Delete deals (depends on lead)
        await supabase.from('deals').delete().eq('lead_id', id)

        // 4. Delete lead
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting lead:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error('Error deleting lead:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
