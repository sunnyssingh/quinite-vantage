import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'
import { corsJSON } from '@/lib/cors'

export async function PATCH(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminClient = createAdminClient()
        const { id } = await params
        const body = await request.json()
        const { status, lead_id } = body

        // Validate status
        const validStatuses = ['available', 'reserved', 'sold']
        if (!status || !validStatuses.includes(status)) {
            return corsJSON({ error: 'Invalid status. Must be: available, reserved, or sold' }, { status: 400 })
        }

        // Get user's organization
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        // Verify property belongs to user's organization
        const { data: property } = await adminClient
            .from('properties')
            .select('id, organization_id, project_id')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single()

        if (!property) {
            return corsJSON({ error: 'Property not found' }, { status: 404 })
        }

        // Update property status
        const { data: updated, error } = await adminClient
            .from('properties')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        // Handle lead linking / unlinking
        if (lead_id && (status === 'reserved' || status === 'sold')) {
            // First clear any previous lead linked to this property
            await adminClient
                .from('leads')
                .update({ property_id: null })
                .eq('property_id', id)
                .neq('id', lead_id)

            // Link the selected lead to this property
            const { error: leadError } = await adminClient
                .from('leads')
                .update({ property_id: id })
                .eq('id', lead_id)
                .eq('organization_id', profile.organization_id)

            if (leadError) console.error('Failed to link lead to property:', leadError)
        } else if (status === 'available') {
            // Unlink all leads from this property when it becomes available again
            await adminClient
                .from('leads')
                .update({ property_id: null })
                .eq('property_id', id)
        }

        // Fetch updated project metrics if property is linked to a project
        let projectMetrics = null
        if (property.project_id) {
            const { data: project } = await adminClient
                .from('projects')
                .select('total_units, sold_units, reserved_units, available_units')
                .eq('id', property.project_id)
                .single()

            projectMetrics = project
        }

        return corsJSON({
            property: updated,
            projectMetrics,
            message: 'Property status updated successfully'
        })
    } catch (e) {
        console.error('properties/[id]/status PATCH error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
