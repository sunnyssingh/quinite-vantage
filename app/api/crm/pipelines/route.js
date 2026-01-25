import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export async function GET() {
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

        // Fetch pipelines with stages
        const { data: pipelines, error } = await adminClient
            .from('pipelines')
            .select(`
        *,
        stages:pipeline_stages(*)
      `)
            .eq('organization_id', profile.organization_id)
            .order('created_at')

        if (error) throw error

        // Sort stages by order_index
        pipelines?.forEach(p => {
            if (p.stages) {
                p.stages.sort((a, b) => a.order_index - b.order_index)
            }
        })

        return corsJSON({ pipelines: pipelines || [] })
    } catch (e) {
        console.error('pipelines GET error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
