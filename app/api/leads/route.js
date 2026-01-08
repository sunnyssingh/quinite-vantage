import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasPermission, logAudit } from '@/lib/permissions'
import { corsJSON } from '@/lib/cors'

/**
 * GET /api/leads
 * Returns all leads for the organization
 */
export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check permission
        const canView = await hasPermission(supabase, user.id, 'leads.view')
        if (!canView) {
            return corsJSON({ error: 'Insufficient permissions' }, { status: 403 })
        }

        // Get user's profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, is_platform_admin')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id && !profile?.is_platform_admin) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        // Use admin client to bypass RLS
        const adminClient = createAdminClient()

        // Get query parameters for filtering
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const projectId = searchParams.get('project_id')
        const search = searchParams.get('search')

        // Build query
        let query = adminClient
            .from('leads')
            .select(`
        id,
        name,
        email,
        phone,
        source,
        status,
        notes,
        project_id,
        created_by,
        created_at,
        updated_at,
        project:projects (
          id,
          name
        )
      `)
            .order('created_at', { ascending: false })

        // Filter by organization
        if (!profile.is_platform_admin) {
            query = query.eq('organization_id', profile.organization_id)
        }

        // Apply filters
        if (status) {
            query = query.eq('status', status)
        }
        if (projectId) {
            query = query.eq('project_id', projectId)
        }
        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
        }

        const { data: leads, error } = await query

        if (error) throw error

        return corsJSON({ leads: leads || [] })
    } catch (e) {
        console.error('leads GET error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}

/**
 * POST /api/leads
 * Create a new lead
 */
export async function POST(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check permission
        const canEdit = await hasPermission(supabase, user.id, 'leads.edit')
        if (!canEdit) {
            return corsJSON({ error: 'Insufficient permissions' }, { status: 403 })
        }

        // Get user's profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, full_name')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        const body = await request.json()
        const { name, email, phone, projectId, status, notes } = body

        // Validation
        if (!name || name.trim() === '') {
            return corsJSON({ error: 'Name is required' }, { status: 400 })
        }

        // Use admin client to create lead
        const adminClient = createAdminClient()

        const { data: lead, error } = await adminClient
            .from('leads')
            .insert({
                organization_id: profile.organization_id,
                project_id: projectId || null,
                created_by: user.id,
                name: name.trim(),
                email: email?.trim() || null,
                phone: phone?.trim() || null,
                status: status || 'new',
                source: 'manual',
                notes: notes?.trim() || null
            })
            .select()
            .single()

        if (error) {
            console.error('Lead creation error:', error)
            return corsJSON({ error: 'Failed to create lead' }, { status: 500 })
        }

        // Audit log
        try {
            await logAudit(
                supabase,
                user.id,
                profile.full_name || user.email,
                'lead.create',
                'lead',
                lead.id,
                { lead_name: lead.name },
                profile.organization_id
            )
        } catch (auditError) {
            console.error('Audit log error:', auditError)
        }

        return corsJSON({ lead }, { status: 201 })
    } catch (e) {
        console.error('leads POST error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
