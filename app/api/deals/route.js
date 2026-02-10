
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const supabase = await createServerSupabaseClient()

        // Get user profile
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { lead_id, property_id, project_id, amount, status, close_date, title, name } = body

        if (!lead_id) {
            return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
        }

        // Get organization_id from user profile
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        const dealData = {
            lead_id,
            organization_id: profile.organization_id,
            status: status || 'active',
            amount: amount ? parseFloat(amount) : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        if (property_id) dealData.property_id = property_id
        if (project_id) dealData.project_id = project_id
        if (close_date) dealData.close_date = close_date
        // Map title or name to 'name' column
        if (title || name) dealData.name = title || name

        // Create deal
        const { data, error } = await adminClient
            .from('deals')
            .insert(dealData)
            .select()
            .single()

        if (error) {
            console.error('Error creating deal:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Sync Lead's Property/Project with the new Deal
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
            // If selecting a project generic deal, maybe clear the specific property?
            // leadUpdate.property_id = null // Optional: decide if we want to clear previous property
        }

        if (Object.keys(leadUpdate).length > 0) {
            await adminClient
                .from('leads')
                .update(leadUpdate)
                .eq('id', lead_id)
        }

        return NextResponse.json({ deal: data })

    } catch (error) {
        console.error('Error in deals POST:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
