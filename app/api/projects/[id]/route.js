import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'
import path from 'path'
import fs from 'fs'
import Ajv from 'ajv'
import { hasDashboardPermission } from '@/lib/dashboardPermissions'

function handleCORS(response) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
}

/* ===================== UPDATE PROJECT ===================== */
import { withAuth } from '@/lib/middleware/withAuth'
import { ProjectService } from '@/services/project.service'

export const PUT = withAuth(async (request, { params, user, profile }) => {
    try {
        const { id } = await params
        const body = await request.json()

        if (!profile?.organization_id) {
            return handleCORS(
                NextResponse.json({ error: 'Profile check failed' }, { status: 404 })
            )
        }

        console.log('[Project Update] Profile found:', profile.organization_id, 'Project ID:', id)

        // Fetch project (IMPORTANT)
        const adminClient = createAdminClient()
        const { data: existing } = await adminClient
            .from('projects')
            .select('id, name, image_path, created_by')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single()

        if (!existing) {
            console.error('[Project Update] Project not found or org mismatch. ProjectId:', id, 'OrgId:', profile.organization_id)
            return handleCORS(
                NextResponse.json({ error: 'Project not found' }, { status: 404 })
            )
        }

        // Permission check
        const isOwner = existing.created_by === user.id
        const canEdit = await hasDashboardPermission(user.id, 'edit_projects')

        if (
            !isOwner &&
            !['super_admin', 'platform_admin'].includes(profile.role) &&
            !canEdit
        ) {
            return handleCORS(
                NextResponse.json({
                    success: false,
                    message: 'You don\'t have permission to edit this project'
                }, { status: 200 })
            )
        }

        // 5️⃣ Build updates
        const updates = {
            updated_at: new Date().toISOString()
        }

        if (body.name !== undefined) updates.name = body.name
        if (body.description !== undefined) updates.description = body.description
        if (body.address !== undefined) updates.address = body.address
        if (body.image_url !== undefined) updates.image_url = body.image_url
        if (body.image_path !== undefined) updates.image_path = body.image_path

        if (body.total_units !== undefined) updates.total_units = body.total_units
        if (body.unit_types !== undefined) updates.unit_types = body.unit_types
        if (body.price_range !== undefined) updates.price_range = body.price_range
        if (body.project_status !== undefined) updates.project_status = body.project_status
        if (body.show_in_inventory !== undefined) updates.show_in_inventory = body.show_in_inventory
        if (body.public_visibility !== undefined) updates.public_visibility = body.public_visibility
        // Validate optional real_estate payload
        const realEstate = body.real_estate || (body.metadata && body.metadata.real_estate)
        if (realEstate) {
            try {
                const schemaPath = path.join(process.cwd(), 'lib', 'schemas', 'realEstateProperty.schema.json')
                const schemaRaw = fs.readFileSync(schemaPath, 'utf8')
                const schema = JSON.parse(schemaRaw)
                const ajv = new Ajv({ allErrors: true, strict: false })
                const validate = ajv.compile(schema)
                const valid = validate(realEstate)
                if (!valid) {
                    return handleCORS(NextResponse.json({ error: 'Invalid real_estate payload', details: validate.errors }, { status: 400 }))
                }
                updates.metadata = { ...(body.metadata || {}), real_estate: realEstate }
            } catch (err) {
                console.error('Schema validation error:', err)
                return handleCORS(NextResponse.json({ error: 'Schema validation failed' }, { status: 500 }))
            }
        }

        // 6️⃣ Update project
        const { data: project, error } = await adminClient
            .from('projects')
            .update(updates)
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .select()
            .single()

        if (error) throw error

        // 7️⃣ Auto-delete old image if replaced
        if (
            existing.image_path &&
            body.image_path &&
            existing.image_path !== body.image_path
        ) {
            await supabase.storage
                .from('project-images')
                .remove([existing.image_path])
        }

        // 9️⃣ Audit
        try {
            await logAudit(
                supabase,
                user.id,
                profile.full_name || user.email,
                'project.edit',
                'project',
                project.id,
                { name: project.name }
            )
        } catch { }

        return handleCORS(NextResponse.json({ project }))
    } catch (e) {
        console.error('projects/:id PUT error:', e)
        return handleCORS(
            NextResponse.json({ error: e.message }, { status: 500 })
        )
    }
})



/* ===================== DELETE PROJECT ===================== */
export async function DELETE(request, { params }) {
    try {
        const { id } = await params
        const supabase = await createServerSupabaseClient()

        // 1️⃣ Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return handleCORS(
                NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            )
        }

        // 2️⃣ Profile
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id, full_name, role')
            .eq('id', user.id)
            .single()

        if (!profile) {
            return handleCORS(NextResponse.json({ error: 'Profile not found' }, { status: 404 }))
        }

        // 3️⃣ Fetch project
        const { data: project } = await adminClient
            .from('projects')
            .select('id, name, image_path, created_by')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single()

        if (!project) {
            return handleCORS(
                NextResponse.json({ error: 'Project not found' }, { status: 404 })
            )
        }

        // 4️⃣ Permission check
        const isOwner = project.created_by === user.id
        const canDelete = await hasDashboardPermission(user.id, 'delete_projects')

        if (
            !isOwner &&
            !['super_admin', 'platform_admin'].includes(profile.role) &&
            !canDelete
        ) {
            return handleCORS(
                NextResponse.json({
                    success: false,
                    message: 'You don\'t have permission to delete this project'
                }, { status: 200 })
            )
        }

        // 5️⃣ Delete associated properties first (cascade delete)
        const { error: propsDeleteError } = await adminClient
            .from('properties')
            .delete()
            .eq('project_id', id)
            .eq('organization_id', profile.organization_id)

        if (propsDeleteError) {
            console.error('Error deleting properties:', propsDeleteError)
            // Continue anyway - we still want to delete the project
        }

        // 6️⃣ Delete DB row
        await adminClient
            .from('projects')
            .delete()
            .eq('id', id)
            .eq('organization_id', profile.organization_id)

        // 7️⃣ Delete image from storage
        if (project.image_path) {
            await supabase.storage
                .from('project-images')
                .remove([project.image_path])
        }

        // 8️⃣ Audit
        try {
            await logAudit(
                supabase,
                user.id,
                profile.full_name || user.email,
                'project.delete',
                'project',
                id,
                { name: project.name }
            )
        } catch { }

        return handleCORS(
            NextResponse.json({ message: 'Project deleted' })
        )
    } catch (e) {
        console.error('projects/:id DELETE error:', e)
        return handleCORS(
            NextResponse.json({ error: e.message }, { status: 500 })
        )
    }
}




/* ===================== GET PROJECT ===================== */
export async function GET(request, { params }) {
    try {
        const { id } = await params // ✅ FIX
        const supabase = await createServerSupabaseClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
        }

        // 2️⃣ Profile
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile) {
            return handleCORS(NextResponse.json({ error: 'Profile not found' }, { status: 404 }))
        }

        const canView = await hasDashboardPermission(user.id, 'view_projects')
        if (!canView) {
            return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
        }

        const { data: project, error } = await adminClient
            .from('projects')
            .select('*')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single()

        if (error) throw error

        return handleCORS(NextResponse.json({ project }))
    } catch (e) {
        console.error('projects/:id GET error:', e)
        return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
    }
}
