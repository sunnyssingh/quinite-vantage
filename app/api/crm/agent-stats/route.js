import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export const dynamic = 'force-dynamic'

export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        // Use Admin Client to bypass RLS for fetching other users
        const adminClient = createAdminClient()

        // Get user's profile to know organization_id
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        // Fetch Total Agents (Role = employee, Phone not null)
        const { count: totalAgents, error: agentsError } = await adminClient
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', profile.organization_id)
            .eq('role', 'employee')
            .not('phone', 'is', null)

        if (agentsError) {
            console.error('Error fetching agents:', agentsError)
            throw agentsError
        }

        // Fetch Agents currently on call
        // We check for calls that are NOT ended
        const { count: agentsOnCall, error: callsError } = await adminClient
            .from('agent_calls')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', profile.organization_id)
            .is('ended_at', null)

        if (callsError) {
            console.error('Error fetching active calls:', callsError)
            throw callsError
        }

        const available = (totalAgents || 0) - (agentsOnCall || 0)

        return corsJSON({
            available: available > 0 ? available : 0,
            onCall: agentsOnCall || 0,
            total: totalAgents || 0
        })

    } catch (error) {
        console.error('Error fetching agent stats:', error)
        return corsJSON({ error: error.message }, { status: 500 })
    }
}
