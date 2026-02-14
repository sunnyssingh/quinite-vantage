import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/permissions'
import { corsJSON } from '@/lib/cors'
import { withAuth } from '@/lib/middleware/withAuth'
import { PropertyService } from '@/services/property.service'

/**
 * GET /api/inventory/properties
 * Fetch properties with filters
 */
export const GET = withAuth(async (request, context) => {
    try {
        const { user, profile } = context

        const { hasDashboardPermission } = await import('@/lib/dashboardPermissions')
        const canView = await hasDashboardPermission(user.id, 'view_inventory')
        if (!canView) {
            return corsJSON({
                success: false,
                message: 'You don\'t have permission to view inventory'
            }, { status: 200 })
        }

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        const { searchParams } = new URL(request.url)
        const filters = {
            status: searchParams.get('status'),
            propertyType: searchParams.get('type'),
            projectId: searchParams.get('project_id')
        }

        const properties = await PropertyService.getProperties(profile.organization_id, filters)

        return corsJSON({ properties: properties || [] })
    } catch (error) {
        console.error('Error fetching properties:', error)
        return corsJSON({ error: error.message }, { status: 500 })
    }
})

/**
 * POST /api/inventory/properties
 * Create a new property
 */
export async function POST(request) {
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
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id, full_name')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) return corsJSON({ error: 'Organization not found' }, { status: 400 })

        const body = await request.json()
        const {
            title, description, projectId, address,
            price, type, status, bedrooms, bathrooms, size
        } = body

        if (!title || !price || !type) {
            return corsJSON({ error: 'Missing required fields' }, { status: 400 })
        }

        // Insert Property
        const { data: property, error } = await adminClient
            .from('properties')
            .insert({
                organization_id: profile.organization_id,
                project_id: projectId || null,
                title,
                description,
                address,
                price,
                type,
                status: status || 'available',
                show_in_crm: typeof body.show_in_crm !== 'undefined' ? body.show_in_crm : true,
                bedrooms: bedrooms || 0,
                bathrooms: bathrooms || 0,
                size_sqft: size || 0,
                created_by: user.id
            })
            .select()
            .single()

        if (error) throw error

        // 2. Insert Images if any
        if (body.images && Array.isArray(body.images) && body.images.length > 0) {
            const imageInserts = body.images.map((img, index) => ({
                property_id: property.id,
                url: img.url,
                is_featured: img.is_featured || false,
                order_index: index
            }))

            const { error: imgError } = await adminClient
                .from('property_images')
                .insert(imageInserts)

            if (imgError) console.error('Failed to insert images:', imgError)
        }

        // Audit Log
        try {
            await logAudit(
                supabase,
                user.id,
                profile.full_name || user.email,
                'property.create',
                'property',
                property.id,
                { title: property.title }
            )
        } catch (e) {
            console.error('Audit log failed', e)
        }

        return corsJSON({ property }, { status: 201 })
    } catch (e) {
        console.error('properties POST error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
