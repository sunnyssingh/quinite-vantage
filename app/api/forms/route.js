
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

// GET /api/forms - List forms
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

        const { data: forms, error } = await adminClient
            .from('lead_forms')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false })

        if (error) throw error

        return corsJSON({ forms })
    } catch (e) {
        return corsJSON({ error: e.message }, { status: 500 })
    }
}

// POST /api/forms - Create/Update form
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

        const body = await request.json()
        const { id, name, schema, projectId, isActive = true } = body

        if (!name) return corsJSON({ error: 'Name is required' }, { status: 400 })

        const payload = {
            name,
            schema: schema || [],
            project_id: projectId === 'none' ? null : projectId,
            is_active: isActive,
            organization_id: profile.organization_id,
            created_by: user.id
        }

        let result
        if (id) {
            const { data, error } = await adminClient
                .from('lead_forms')
                .update(payload)
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            result = data
        } else {
            const { data, error } = await adminClient
                .from('lead_forms')
                .insert(payload)
                .select()
                .single()
            if (error) throw error
            result = data
        }

        return corsJSON({ form: result })
    } catch (e) {
        console.error('Form save error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
