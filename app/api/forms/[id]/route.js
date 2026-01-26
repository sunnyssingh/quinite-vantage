
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

// GET /api/forms/[id] - Public fetch
export async function GET(request, { params }) {
    try {
        const { id } = await params
        if (!id) return corsJSON({ error: 'Missing ID' }, { status: 400 })

        const adminClient = createAdminClient()
        const { data: form, error } = await adminClient
            .from('lead_forms')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !form) {
            return corsJSON({ error: 'Form not found' }, { status: 404 })
        }

        if (!form.is_active) {
            return corsJSON({ error: 'Form is not active' }, { status: 404 })
        }

        return corsJSON({ form })
    } catch (e) {
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
