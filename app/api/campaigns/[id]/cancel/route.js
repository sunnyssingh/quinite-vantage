import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export const dynamic = 'force-dynamic'

/**
 * POST /api/campaigns/[id]/cancel
 * Cancels an active campaign
 */
export async function POST(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const adminClient = createAdminClient()

        // Update status to cancelled
        const { error } = await adminClient
            .from('campaigns')
            .update({ status: 'cancelled' })
            .eq('id', id)

        if (error) throw error

        return corsJSON({ success: true })
    } catch (e) {
        console.error('campaign cancel error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
