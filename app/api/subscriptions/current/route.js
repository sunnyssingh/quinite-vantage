import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'
import { getUsageStats } from '@/lib/middleware/feature-limits'
import { getCreditBalance, checkSubscriptionStatus } from '@/lib/middleware/subscription'

export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminClient = createAdminClient()

        // Get user's profile to find organization
        const { data: profile, error: profileError } = await adminClient
            .from('profiles')
            .select('organization_id, role')
            .eq('id', user.id)
            .single()

        console.log('[Subscription API] User:', user.email, 'Profile:', profile, 'Error:', profileError)

        if (!profile?.organization_id) {
            return corsJSON({ error: 'No organization found' }, { status: 404 })
        }

        const orgId = profile.organization_id

        // Get current subscription with plan details
        const { data: subscription, error: subError } = await adminClient
            .from('subscriptions')
            .select(`
        *,
        plan:subscription_plans(*)
      `)
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (subError && subError.code !== 'PGRST116') {
            throw subError
        }

        // Check subscription status (handles lazy period-end expiry in DB)
        const subscriptionStatus = await checkSubscriptionStatus(orgId)

        // If period ended and status was still active in DB, reflect that in the returned object
        if (subscription && !subscriptionStatus.isActive && subscription.status === 'active') {
            subscription.status = 'past_due'
        }

        // Fetch usage stats and credit balance in parallel
        const [usageStats, credits] = await Promise.all([
            getUsageStats(orgId),
            getCreditBalance(orgId)
        ])

        // Build usage shape — fall back to zeroes if no active subscription
        const usage = usageStats
            ? {
                projects:  usageStats.projects,
                leads:     usageStats.leads,
                campaigns: usageStats.campaigns,
                users:     usageStats.users
            }
            : {
                projects:  { count: 0, active: 0, archived: 0, limit: null },
                leads:     { count: 0, active: 0, archived: 0, limit: null },
                campaigns: { count: 0, active: 0, archived: 0, limit: null },
                users:     { count: 0, limit: null }
            }

        // Compute over_limit flags (treat -1/null limit as unlimited)
        const isOverLimit = (count, limit) => limit !== null && limit !== -1 && count > limit
        const over_limit = {
            projects:  isOverLimit(usage.projects.count,  usage.projects.limit),
            leads:     isOverLimit(usage.leads.count,     usage.leads.limit),
            campaigns: isOverLimit(usage.campaigns.count, usage.campaigns.limit),
            users:     isOverLimit(usage.users.count,     usage.users.limit)
        }

        return corsJSON({
            subscription: subscription || null,
            plan: subscription?.plan || null,
            usage,
            credits,
            over_limit
        })
    } catch (e) {
        console.error('subscriptions/current GET error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
