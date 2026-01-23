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

        // Get current subscription with plan details
        const { data: subscription, error: subError } = await adminClient
            .from('subscriptions')
            .select(`
        *,
        plan:subscription_plans(*)
      `)
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (subError && subError.code !== 'PGRST116') {
            throw subError
        }

        // Get usage for current period
        const periodStart = subscription?.current_period_start
            ? new Date(subscription.current_period_start).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]

        const periodEnd = subscription?.current_period_end
            ? new Date(subscription.current_period_end).toISOString().split('T')[0]
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        const { data: usage } = await adminClient
            .from('usage_logs')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .gte('period_start', periodStart)
            .lte('period_end', periodEnd)

        // Get current counts from actual tables
        // Get current counts from actual tables
        const [
            { count: projectsCount, error: projectsError },
            { count: usersCount, error: usersError },
            { count: campaignsCount, error: campaignsError },
            { count: callsCount, error: callsError }
        ] = await Promise.all([
            adminClient.from('projects').select('*', { count: 'exact', head: true }).eq('organization_id', profile.organization_id),
            adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('organization_id', profile.organization_id),
            adminClient.from('campaigns').select('*', { count: 'exact', head: true }).eq('organization_id', profile.organization_id),
            adminClient.from('call_logs').select('*', { count: 'exact', head: true }).eq('organization_id', profile.organization_id)
        ])

        if (projectsError) console.error('Projects count error:', projectsError)
        if (usersError) console.error('Users count error:', usersError)
        if (campaignsError) console.error('Campaigns count error:', campaignsError)
        if (callsError) console.error('Call logs count error:', callsError)

        const currentUsage = {
            projects: projectsCount || 0,
            users: usersCount || 0,
            campaigns: campaignsCount || 0,
            ai_calls: callsCount || 0
        }

        // Calculate usage percentages
        const features = subscription?.plan?.features || {}
        const usagePercentages = {
            projects: features.max_projects > 0 ? (currentUsage.projects / features.max_projects) * 100 : 0,
            users: features.max_users > 0 ? (currentUsage.users / features.max_users) * 100 : 0,
            campaigns: features.max_campaigns > 0 ? (currentUsage.campaigns / features.max_campaigns) * 100 : 0,
            ai_calls: features.ai_calls_per_month > 0 ? (currentUsage.ai_calls / features.ai_calls_per_month) * 100 : 0
        }

        return corsJSON({
            subscription: subscription || null,
            usage: currentUsage,
            usagePercentages,
            limits: {
                projects: features.max_projects || 0,
                users: features.max_users || 0,
                campaigns: features.max_campaigns || 0,
                ai_calls: features.ai_calls_per_month || 0
            }
        })
    } catch (e) {
        console.error('subscriptions/current GET error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminClient = createAdminClient()

        // Get user's profile
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id, role, email')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'No organization found' }, { status: 404 })
        }

        // Only super_admin can manage subscriptions
        if (profile.role !== 'super_admin') {
            return corsJSON({ error: 'Only organization admins can manage subscriptions' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const action = searchParams.get('action')

        if (action === 'cancel') {
            // Cancel subscription
            const { data, error } = await adminClient
                .from('subscriptions')
                .update({
                    cancel_at_period_end: true,
                    cancelled_at: new Date().toISOString()
                })
                .eq('organization_id', profile.organization_id)
                .eq('status', 'active')
                .select()
                .single()

            if (error) throw error

            // Log action
            await adminClient.from('audit_logs').insert({
                organization_id: profile.organization_id,
                user_id: user.id,
                user_name: profile.email || user.email,
                action: 'SUBSCRIPTION_CANCELLED',
                entity_type: 'subscription',
                entity_id: data.id
            })

            return corsJSON({ success: true, subscription: data })
        }

        if (action === 'upgrade') {
            const { plan_slug } = await request.json()

            if (!plan_slug) {
                return corsJSON({ error: 'Plan slug required' }, { status: 400 })
            }

            // Get new plan
            const { data: newPlan, error: planError } = await adminClient
                .from('subscription_plans')
                .select('*')
                .eq('slug', plan_slug)
                .single()

            if (planError || !newPlan) {
                return corsJSON({ error: 'Plan not found' }, { status: 404 })
            }

            // Get current subscription
            const { data: currentSub } = await adminClient
                .from('subscriptions')
                .select('*')
                .eq('organization_id', profile.organization_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            // Update subscription
            const { data, error } = await adminClient
                .from('subscriptions')
                .update({
                    plan_id: newPlan.id,
                    status: 'active',
                    cancel_at_period_end: false,
                    trial_ends_at: null,
                    current_period_start: new Date().toISOString(),
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                })
                .eq('id', currentSub.id)
                .select()
                .single()

            if (error) throw error

            // Log action
            await adminClient.from('audit_logs').insert({
                organization_id: profile.organization_id,
                user_id: user.id,
                user_name: profile.email || user.email,
                action: 'SUBSCRIPTION_UPGRADED',
                entity_type: 'subscription',
                entity_id: data.id,
                metadata: { new_plan: plan_slug }
            })

            return corsJSON({ success: true, subscription: data })
        }

        return corsJSON({ error: 'Invalid action' }, { status: 400 })
    } catch (e) {
        console.error('subscriptions/current POST error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
