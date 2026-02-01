import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        const admin = createAdminClient()
        const { data: profile } = await admin
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')

        if (!query || query.length < 2) {
            return corsJSON({ results: { leads: [], projects: [], campaigns: [] } })
        }

        const searchTerm = `%${query}%`
        const orgId = profile.organization_id

        // Run queries in parallel
        const [leadsRes, projectsRes, campaignsRes] = await Promise.all([
            // Search Leads
            admin
                .from('leads')
                .select('id, name, email, phone')
                .eq('organization_id', orgId)
                .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
                .limit(5),

            // Search Projects
            admin
                .from('projects')
                .select('id, name, address')
                .eq('organization_id', orgId)
                .or(`name.ilike.${searchTerm},address.ilike.${searchTerm}`)
                .limit(5),

            // Search Campaigns
            admin
                .from('campaigns')
                .select('id, name, status')
                .eq('organization_id', orgId)
                .ilike('name', searchTerm)
                .limit(5)
        ])

        const results = {
            leads: leadsRes.data || [],
            projects: projectsRes.data || [],
            campaigns: campaignsRes.data || []
        }

        return corsJSON({ results })

    } catch (e) {
        console.error('Search API error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
