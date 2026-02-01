
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        const { searchParams } = new URL(request.url)
        // projectId param ignored as pipeline_stages doesn't have project_id in schema

        // Step 1: Get all pipeline IDs for this organization
        const { data: orgPipelines, error: pipeError } = await adminClient
            .from('pipelines')
            .select('id')
            .eq('organization_id', profile.organization_id)

        if (pipeError) throw pipeError

        const pipelineIds = orgPipelines.map(p => p.id)

        // Step 2: Fetch stages for these pipelines
        let query = adminClient
            .from('pipeline_stages')
            // Using pipeline_id to link to organization. Removing project_id selection.
            // Correcting column name: position -> order_index
            .select('id, name, color, order_index, pipeline_id')
            .in('pipeline_id', pipelineIds)
            .order('order_index', { ascending: true })

        const { data: stages, error } = await query

        if (error) throw error

        return corsJSON({ stages: stages || [] })
    } catch (e) {
        console.error('stages GET error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        const body = await request.json()
        const { pipeline_id, name, color, order_index } = body

        if (!pipeline_id || !name) {
            return corsJSON({ error: 'Missing required fields' }, { status: 400 })
        }

        // Verify pipeline belongs to org
        const { data: pipeline } = await adminClient
            .from('pipelines')
            .select('id')
            .eq('id', pipeline_id)
            .eq('organization_id', profile.organization_id)
            .single()

        if (!pipeline) {
            return corsJSON({ error: 'Pipeline not found or access denied' }, { status: 403 })
        }

        const { data: newStage, error } = await adminClient
            .from('pipeline_stages')
            .insert({
                pipeline_id,
                name,
                color: color || '#cbd5e1',
                order_index: order_index || 0
            })
            .select()
            .single()

        if (error) throw error

        return corsJSON({ stage: newStage })

    } catch (e) {
        console.error('stages POST error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminClient = createAdminClient()
        // ... (profile check omitted for brevity, simpler to reuse)
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        const body = await request.json()
        const { stages } = body // Expecting array of { id, name, color, order_index }

        if (!Array.isArray(stages)) {
            return corsJSON({ error: 'Invalid payload: stages array required' }, { status: 400 })
        }

        // We should verify ownership of these stages, but for now assuming if they have ID they exist.
        // A robust implementation would filter updates by organization ownership. 
        // We'll trust the RLS policies or simple checks if RLS isn't strict enough on 'adminClient'.
        // Since we are using adminClient, we bypass RLS, so ID verification is crucial.

        // Fetch all stage IDs belonging to this org's pipelines to verify
        const { data: orgPipelines } = await adminClient
            .from('pipelines')
            .select('id')
            .eq('organization_id', profile.organization_id)

        const validPipelineIds = orgPipelines.map(p => p.id)

        // Bulk upsert is tricky with ownership check. 
        // Simplest strategy: iterate and update. Or use `upsert` and trust RLS/Policies logic (but we are admin).
        // Let's iterate for safety.

        const updates = stages.map(async (stage) => {
            // Verify this stage belongs to a valid pipeline
            if (!stage.id) return null // Skip creation here, use POST

            const { data: currentStage } = await adminClient.from('pipeline_stages').select('pipeline_id').eq('id', stage.id).single()
            if (!currentStage || !validPipelineIds.includes(currentStage.pipeline_id)) {
                return null // Invalid or unauthorized
            }

            return adminClient
                .from('pipeline_stages')
                .update({
                    name: stage.name,
                    color: stage.color,
                    order_index: stage.order_index
                })
                .eq('id', stage.id)
        })

        await Promise.all(updates)

        return corsJSON({ success: true })

    } catch (e) {
        console.error('stages PUT error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
