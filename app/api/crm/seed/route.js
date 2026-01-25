import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

/**
 * POST /api/crm/seed
 * Create a default pipeline and stages for the organization
 */
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

        // 1. Create Default Pipeline
        const { data: pipeline, error: pipeError } = await adminClient
            .from('pipelines')
            .insert({
                organization_id: profile.organization_id,
                name: 'Sales Pipeline',
                is_default: true
            })
            .select()
            .single()

        if (pipeError) throw pipeError

        // 2. Create Default Stages
        const stages = [
            { name: 'New Lead', order_index: 0, color: '#3b82f6' },
            { name: 'Contacted', order_index: 1, color: '#eab308' },
            { name: 'Qualified', order_index: 2, color: '#22c55e' },
            { name: 'Negotiation', order_index: 3, color: '#a855f7' },
            { name: 'Won', order_index: 4, color: '#15803d' },
            { name: 'Lost', order_index: 5, color: '#ef4444' }
        ]

        const stagesWithIds = stages.map(s => ({
            ...s,
            pipeline_id: pipeline.id
        }))

        const { error: stageError } = await adminClient
            .from('pipeline_stages')
            .insert(stagesWithIds)

        if (stageError) throw stageError

        return corsJSON({ success: true, pipeline })
    } catch (e) {
        console.error('crm seed error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
