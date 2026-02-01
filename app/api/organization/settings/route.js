import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        // Use admin client to fetch profile with organization
        // This bypasses RLS policies that might be causing issues
        const admin = createAdminClient()

        // First get the user's profile to find their organization_id
        const { data: profile, error: profileError } = await admin
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (profileError || !profile?.organization_id) {
            console.error('Profile fetch error or no org id:', profileError)
            return corsJSON({ error: 'Organization not found' }, { status: 404 })
        }

        // Now fetch the organization details
        const { data: organization, error: orgError } = await admin
            .from('organizations')
            .select('*')
            .eq('id', profile.organization_id)
            .single()

        if (orgError) {
            console.error('Organization fetch error:', orgError)
            return corsJSON({ error: 'Failed to fetch organization' }, { status: 500 })
        }

        // Fetch active subscription to ensure tier is up to date
        const { data: subscription } = await admin
            .from('subscriptions')
            .select(`
                plan_id,
                plan:subscription_plans(slug, name)
            `)
            .eq('organization_id', profile.organization_id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        // If active subscription exists, override the stored tier to ensure accuracy
        if (subscription?.plan?.slug) {
            organization.tier = subscription.plan.slug
        }

        return corsJSON({ organization })
    } catch (e) {
        console.error('organization/settings error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, sector, company_name, address, logo_url } = body

        const admin = createAdminClient()

        // Get profile to find organization_id
        const { data: profile, error: profileError } = await admin
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (profileError || !profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 404 })
        }

        // First fetch existing organization to preserve settings
        const { data: existingOrg, error: fetchError } = await admin
            .from('organizations')
            .select('settings')
            .eq('id', profile.organization_id)
            .single()

        if (fetchError) {
            return corsJSON({ error: 'Failed to fetch organization' }, { status: 500 })
        }

        // Merge settings
        // We ensure we don't overwrite existing settings with undefined if not provided
        const updatedSettings = {
            ...existingOrg.settings,
        }

        // Only update fields if they are provided in the request body
        if (address !== undefined) updatedSettings.address = address
        if (logo_url !== undefined) updatedSettings.logo_url = logo_url

        const updates = {
            updated_at: new Date().toISOString()
        }

        if (name !== undefined) updates.name = name
        if (sector !== undefined) updates.sector = sector
        if (company_name !== undefined) updates.company_name = company_name
        if (body.country !== undefined) updates.country = body.country
        if (body.currency !== undefined) updates.currency = body.currency
        if (body.currency_symbol !== undefined) updates.currency_symbol = body.currency_symbol

        // Always include settings as we might have merged updates
        updates.settings = updatedSettings

        const { data: updatedOrg, error: updateError } = await admin
            .from('organizations')
            .update(updates)
            .eq('id', profile.organization_id)
            .select()
            .single()

        if (updateError) {
            console.error('Organization update error:', updateError)
            return corsJSON({ error: 'Failed to update organization' }, { status: 500 })
        }

        return corsJSON({ organization: updatedOrg })

    } catch (e) {
        console.error('organization/settings update error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
