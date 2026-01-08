import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasPermission } from '@/lib/permissions'
import { corsJSON } from '@/lib/cors'

/**
 * GET /api/campaigns/[id]/logs
 * Get all call logs for a campaign
 */
export async function GET(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check permission
        const canView = await hasPermission(supabase, user.id, 'campaign.view')
        if (!canView) {
            return corsJSON({ error: 'Insufficient permissions' }, { status: 403 })
        }

        // Get user's profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        const { id } = await params
        const adminClient = createAdminClient()

        // Verify campaign belongs to organization
        const { data: campaign } = await adminClient
            .from('campaigns')
            .select('id, name, organization_id')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single()

        if (!campaign) {
            return corsJSON({ error: 'Campaign not found' }, { status: 404 })
        }

        // Get call logs with lead details
        const { data: logs, error } = await adminClient
            .from('call_logs')
            .select(`
        id,
        call_status,
        transferred,
        call_timestamp,
        duration,
        notes,
        lead:leads (
          id,
          name,
          email,
          phone
        )
      `)
            .eq('campaign_id', id)
            .order('call_timestamp', { ascending: false })

        if (error) throw error

        return corsJSON({
            campaign: {
                id: campaign.id,
                name: campaign.name
            },
            logs: logs || [],
            summary: {
                totalCalls: logs?.length || 0,
                transferred: logs?.filter(l => l.transferred).length || 0,
                conversionRate: logs?.length > 0
                    ? ((logs.filter(l => l.transferred).length / logs.length) * 100).toFixed(2)
                    : 0
            }
        })
    } catch (e) {
        console.error('campaign logs error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
