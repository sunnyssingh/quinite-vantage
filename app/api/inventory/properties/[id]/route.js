import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

/**
 * PATCH /api/inventory/properties/[id]
 * Update property fields (especially show_in_crm toggle)
 */
export async function PATCH(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) return corsJSON({ error: 'Unauthorized' }, { status: 401 })

        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) return corsJSON({ error: 'Organization not found' }, { status: 400 })

        const { id } = await params
        const body = await request.json()

        // Build update object with all allowed fields
        const allowedUpdates = {
            updated_at: new Date().toISOString()
        }

        // Core fields
        if (body.title !== undefined) allowedUpdates.title = body.title
        if (body.description !== undefined) allowedUpdates.description = body.description
        if (body.address !== undefined) allowedUpdates.address = body.address
        if (body.price !== undefined) allowedUpdates.price = body.price
        if (body.bedrooms !== undefined) allowedUpdates.bedrooms = body.bedrooms
        if (body.bathrooms !== undefined) allowedUpdates.bathrooms = body.bathrooms
        if (body.size_sqft !== undefined) allowedUpdates.size_sqft = body.size_sqft
        // Handle legacy/frontend 'area' payload if necessary, or just rely on correct frontend
        if (body.area !== undefined) allowedUpdates.size_sqft = body.area

        // Status and visibility
        if (body.status !== undefined) allowedUpdates.status = body.status
        if (body.show_in_crm !== undefined) allowedUpdates.show_in_crm = body.show_in_crm
        if (body.project_id !== undefined) allowedUpdates.project_id = body.project_id

        const { data: property, error } = await adminClient
            .from('properties')
            .update(allowedUpdates)
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .select()
            .single()

        if (error) throw error

        return corsJSON({ property })
    } catch (e) {
        console.error('properties PATCH error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
