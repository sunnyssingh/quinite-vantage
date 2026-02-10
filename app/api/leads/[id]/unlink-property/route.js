
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

        const adminClient = createAdminClient()

        // 1. Get current property to release status if needed
        const { data: lead } = await adminClient
            .from('leads')
            .select('property_id')
            .eq('id', leadId)
            .single()

        // 2. Unlink from Lead (clear property_id and project_id)
        const { error: updateError } = await adminClient
            .from('leads')
            .update({ property_id: null, project_id: null }) // We clear both? Or just property? User said "delink". Usually implies clearing current selection.
            .eq('id', leadId)

        if (updateError) throw updateError

        // 3. Mark property as 'available' if it was reserved?
        // Logic: If the property is not sold, make it available again.
        if (lead?.property_id) {
            const { data: prop } = await adminClient
                .from('properties')
                .select('status')
                .eq('id', lead.property_id)
                .single()

            if (prop && prop.status === 'reserved') {
                await adminClient
                    .from('properties')
                    .update({ status: 'available' })
                    .eq('id', lead.property_id)
            }
        }

        return corsJSON({ success: true })

    } catch (e) {
        console.error('Unlink property error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
