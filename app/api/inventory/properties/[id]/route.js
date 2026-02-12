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

        const { hasDashboardPermission } = await import('@/lib/dashboardPermissions')
        const canEdit = await hasDashboardPermission(user.id, 'edit_inventory')
        const canManage = await hasDashboardPermission(user.id, 'manage_inventory')

        if (!canEdit && !canManage) {
            return corsJSON({
                success: false,
                message: 'You don\'t have permission to edit inventory'
            }, { status: 200 })
        }

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

        // Update Images (Delete all and re-insert strategy)
        if (body.images && Array.isArray(body.images)) {
            // Delete existing
            await adminClient
                .from('property_images')
                .delete()
                .eq('property_id', id)

            // Insert new ones
            if (body.images.length > 0) {
                const imageInserts = body.images.map((img, index) => ({
                    property_id: id,
                    url: img.url,
                    is_featured: img.is_featured || false,
                    order_index: index
                }))

                const { error: imgError } = await adminClient
                    .from('property_images')
                    .insert(imageInserts)

                if (imgError) console.error('Failed to update images:', imgError)
            }
        }

        return corsJSON({ property })
    } catch (e) {
        console.error('properties PATCH error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}

/**
 * DELETE /api/inventory/properties/[id]
 * Delete a property
 */
export async function DELETE(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) return corsJSON({ error: 'Unauthorized' }, { status: 401 })

        const { hasDashboardPermission } = await import('@/lib/dashboardPermissions')
        const canManage = await hasDashboardPermission(user.id, 'manage_inventory')
        if (!canManage) {
            return corsJSON({
                success: false,
                message: 'You don\'t have permission to manage inventory'
            }, { status: 200 })
        }

        const adminClient = createAdminClient()
        const { id } = await params

        // Verify organization ownership
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) return corsJSON({ error: 'Organization not found' }, { status: 400 })

        // Check ownership
        const { data: property, error: fetchError } = await adminClient
            .from('properties')
            .select('id')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single()

        if (fetchError || !property) {
            return corsJSON({ error: 'Property not found or access denied' }, { status: 404 })
        }

        // Delete (images cascade via FK)
        const { error: deleteError } = await adminClient
            .from('properties')
            .delete()
            .eq('id', id)

        if (deleteError) throw deleteError

        return corsJSON({ success: true })
    } catch (e) {
        console.error('properties DELETE error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
