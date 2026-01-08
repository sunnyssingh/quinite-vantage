import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hasPermission, logAudit } from '@/lib/permissions'
import Ajv from 'ajv'
import fs from 'fs'
import path from 'path'

function handleCORS(response) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
}

/* ===================== UPDATE PROJECT ===================== */
export async function PUT(request, { params }) {
    try {
        const { id } = await params
        const supabase = await createServerSupabaseClient()
        const body = await request.json()

        // 1️⃣ Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return handleCORS(
                NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            )
        }

        // 2️⃣ Profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, full_name, is_platform_admin')
            .eq('id', user.id)
            .single()

        // 3️⃣ Fetch project (IMPORTANT)
        const { data: existing } = await supabase
            .from('projects')
            .select('id, name, image_path, created_by')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single()

        if (!existing) {
            return handleCORS(
                NextResponse.json({ error: 'Project not found' }, { status: 404 })
            )
        }

        // 4️⃣ Permission check
        const canEdit = await hasPermission(supabase, user.id, 'project.edit')
        const isOwner = existing.created_by === user.id

        if (
            !canEdit &&
            !isOwner &&
            !profile.is_platform_admin
        ) {
            return handleCORS(
                NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
        const { data: project, error } = await supabase
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

        // 8️⃣ Audit
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
}



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
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, full_name, is_platform_admin')
            .eq('id', user.id)
            .single()

        // 3️⃣ Fetch project
        const { data: project } = await supabase
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
        const canDelete = await hasPermission(supabase, user.id, 'project.delete')

        const isOwner = project.created_by === user.id

        if (
            !canDelete &&
            !isOwner &&
            !profile.is_platform_admin
        ) {
            return handleCORS(
                NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            )
        }

        // 5️⃣ Delete DB row
        await supabase
            .from('projects')
            .delete()
            .eq('id', id)
            .eq('organization_id', profile.organization_id)

        // 6️⃣ Delete image from storage
        if (project.image_path) {
            await supabase.storage
                .from('project-images')
                .remove([project.image_path])
        }

        // 7️⃣ Audit
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

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        const { data: project, error } = await supabase
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
