import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'
import { corsJSON } from '@/lib/cors'

export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminClient = createAdminClient()

        // Get user's organization
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        // Fetch projects with show_in_inventory = true
        const { data: projects, error } = await adminClient
            .from('projects')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .eq('show_in_inventory', true)
            .order('created_at', { ascending: false })

        if (error) throw error

        return corsJSON({ projects: projects || [] })
    } catch (e) {
        console.error('inventory/projects GET error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
