import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasPermission, logAudit } from '@/lib/permissions'
import { corsJSON } from '@/lib/cors'
import { getDefaultAvatar } from '@/lib/avatar-utils'

console.log('[Leads API] Avatar utility loaded:', typeof getDefaultAvatar)

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

        // Use admin client to bypass RLS and get reliable profile
        const adminClient = createAdminClient()

        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id, role')
            .eq('id', user.id)
            .single()

        const isPlatformAdmin = profile?.role === 'platform_admin'

        if (!profile?.organization_id && !isPlatformAdmin) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        // Get query parameters for filtering
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const projectId = searchParams.get('project_id')
        const stageId = searchParams.get('stage_id') // [NEW]
        const search = searchParams.get('search')

        // Build query - fetch all columns including call_status and project
        let query = adminClient
            .from('leads')
            .select(`
                *,
                project:projects(id, name),
                stage:pipeline_stages(id, name, color),
                deals(id, amount, status)
            `)
            .order('created_at', { ascending: false })

        // Platform admins can see all leads, regular users only see their org
        if (!isPlatformAdmin) {
            query = query.eq('organization_id', profile.organization_id)
        }

        // Apply filters
        if (status) { // Legacy / Fallback
            query = query.eq('status', status)
        }
        if (projectId) {
            query = query.eq('project_id', projectId)
        }
        if (stageId && stageId !== 'all') { // [NEW] Filter by Stage
            query = query.eq('stage_id', stageId)
        }
        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
        }

        const { data: leads, error } = await query

        if (error) throw error

        console.log('✅ [Leads GET] Fetched', leads?.length || 0, 'leads')
        if (leads && leads.length > 0) {
            console.log('📊 [Leads GET] Sample lead:', {
                id: leads[0].id,
                name: leads[0].name,
                stage_id: leads[0].stage_id,
                stage: leads[0].stage,
                call_status: leads[0].call_status,
                call_log_id: leads[0].call_log_id
            })
        }

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
        console.log('📝 [Leads POST] Starting lead creation...')

        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.log('❌ [Leads POST] Unauthorized')
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('✅ [Leads POST] User authenticated:', user.email)

        // Get user's profile with admin client
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id, role, full_name') // Added full_name back for audit log
            .eq('id', user.id)
            .single()

        const isPlatformAdmin = profile?.role === 'platform_admin'

        if (!profile?.organization_id && !isPlatformAdmin) {
            console.log('❌ [Leads POST] No organization found')
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        console.log('✅ [Leads POST] Organization ID:', profile.organization_id)

        const body = await request.json()
        const { name, email, phone, projectId, status, notes, stageId, dealValue } = body

        console.log('📋 [Leads POST] Lead data:', { name, email, phone, projectId, status, stageId, dealValue })

        // Validation
        if (!name || name.trim() === '') {
            console.log('❌ [Leads POST] Name is required')
            return corsJSON({ error: 'Name is required' }, { status: 400 })
        }


        let finalStageId = stageId || null
        if (profile.organization_id && !finalStageId) {
            try {
                // 1. Get default pipeline
                const { data: pipelines } = await adminClient
                    .from('pipelines')
                    .select('id')
                    .eq('organization_id', profile.organization_id)
                    .eq('is_default', true)
                    .limit(1)

                let pipelineId = pipelines?.[0]?.id

                // Fallback: If no default, just take the first one
                if (!pipelineId) {
                    const { data: allPipelines } = await adminClient
                        .from('pipelines')
                        .select('id')
                        .eq('organization_id', profile.organization_id)
                        .limit(1)
                    pipelineId = allPipelines?.[0]?.id
                }

                if (pipelineId) {
                    // 2. Get first stage of that pipeline
                    // Note: User schema says 'order_index', not 'position'
                    const { data: stages } = await adminClient
                        .from('pipeline_stages')
                        .select('id')
                        .eq('pipeline_id', pipelineId)
                        .order('order_index', { ascending: true })
                        .limit(1)

                    if (stages && stages.length > 0) {
                        finalStageId = stages[0].id
                        console.log('✅ [Leads POST] Auto-assigned to first stage:', finalStageId)
                    }
                }
            } catch (err) {
                console.warn('⚠️ [Leads POST] Could not fetch default stage:', err)
            }
        }

        // Create the lead with auto-assigned avatar
        const { data: lead, error } = await adminClient
            .from('leads')
            .insert({
                name: name.trim(),
                email: email?.trim() || null,
                phone: phone?.trim() || null,
                project_id: projectId || null,
                stage_id: finalStageId, // Use provided or auto-assigned stage
                status: status || 'new',
                notes: notes?.trim() || null,
                organization_id: profile.organization_id,
                created_by: user.id,
                source: 'manual',
                avatar_url: getDefaultAvatar(email || name) // Auto-assign avatar based on email or name
            })
            .select()
            .single()

        if (error) {
            console.log('❌ [Leads POST] Database error:', error.message)
            throw error
        }

        console.log('✅ [Leads POST] Lead created successfully:', lead.id)

        // [Schema Alignment] Create Deal if value is provided
        if (dealValue && !isNaN(parseFloat(dealValue))) {
            const { error: dealError } = await adminClient
                .from('deals')
                .insert({
                    lead_id: lead.id,
                    amount: parseFloat(dealValue),
                    status: 'active', // Default status
                    organization_id: profile.organization_id,
                    // Optional: sync stage name if available, but staying minimal for now
                })

            if (dealError) {
                console.error('⚠️ [Leads POST] Failed to create deal:', dealError)
                // Don't fail the whole request, but log it
            } else {
                console.log('💰 [Leads POST] Deal created with value:', dealValue)
            }
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
                { lead_name: lead.name, value: dealValue }
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
