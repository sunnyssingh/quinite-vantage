import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export async function POST(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) return corsJSON({ error: 'Unauthorized' }, { status: 401 })

        const { id: leadId } = await params
        const { property_id } = await request.json()

        if (!property_id) return corsJSON({ error: 'Property ID required' }, { status: 400 })

        const adminClient = createAdminClient()

        // 1. Verify Property is available
        const { data: property } = await adminClient
            .from('properties')
            .select('status, id, project_id')
            .eq('id', property_id)
            .single()

        if (!property) return corsJSON({ error: 'Property not found' }, { status: 404 })

        // 2. Link to Lead (and sync project_id)
        const updateData = { property_id }
        if (property.project_id) updateData.project_id = property.project_id

        const { error: updateError } = await adminClient
            .from('leads')
            .update(updateData)
            .eq('id', leadId)

        if (updateError) throw updateError

        // 3. Optional: Automatically reserve the property?
        // User workflow: Link Property -> Mark Deal Won -> Property Sold.
        // Maybe linking sets it to 'Reserved'?
        // Let's set it to 'reserved' to prevent double booking.
        await adminClient
            .from('properties')
            .update({ status: 'reserved' })
            .eq('id', property_id)

        return corsJSON({ success: true })

    } catch (e) {
        console.error('Link property error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
