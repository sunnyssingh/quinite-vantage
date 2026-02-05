import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'
import { corsJSON } from '@/lib/cors'

export async function GET(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminClient = createAdminClient()
        const { id } = await params

        // Get user's organization
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        // Verify project belongs to user's organization
        const { data: project } = await adminClient
            .from('projects')
            .select('id, organization_id')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single()

        if (!project) {
            return corsJSON({ error: 'Project not found' }, { status: 404 })
        }

        // Fetch all properties for this project
        const { data: properties, error } = await adminClient
            .from('properties')
            .select('*')
            .eq('project_id', id)
            .order('created_at', { ascending: false })

        if (error) throw error

        return corsJSON({ properties: properties || [] })
    } catch (e) {
        console.error('projects/[id]/properties GET error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
