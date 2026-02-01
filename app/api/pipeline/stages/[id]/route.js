
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export async function DELETE(request, { params }) {
    try {
        const stageId = params.id
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

        // Verify stage ownership
        // Get stage -> pipeline -> organization
        const { data: stage } = await adminClient
            .from('pipeline_stages')
            .select('pipeline_id')
            .eq('id', stageId)
            .single()

        if (!stage) {
            return corsJSON({ error: 'Stage not found' }, { status: 404 })
        }

        const { data: pipeline } = await adminClient
            .from('pipelines')
            .select('organization_id')
            .eq('id', stage.pipeline_id)
            .single()

        if (!pipeline || pipeline.organization_id !== profile.organization_id) {
            return corsJSON({ error: 'Unauthorized access to stage' }, { status: 403 })
        }

        // Delete stage
        const { error: deleteError } = await adminClient
            .from('pipeline_stages')
            .delete()
            .eq('id', stageId)

        if (deleteError) throw deleteError

        return corsJSON({ success: true })

    } catch (e) {
        console.error('stage DELETE error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
