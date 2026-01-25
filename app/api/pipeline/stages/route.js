
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
