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

        // Check platform admin access
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'platform_admin') {
            return corsJSON({ error: 'Platform Admin access required' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const planSlug = searchParams.get('plan')

        // Build query
        let query = adminClient
            .from('subscriptions')
            .select(`
        *,
        organization:organizations(id, name, company_name),
        plan:subscription_plans(id, name, slug, price_monthly, price_yearly)
      `)
            .order('created_at', { ascending: false })

        if (status) {
            query = query.eq('status', status)
        }

        if (planSlug) {
            const { data: plan } = await adminClient
                .from('subscription_plans')
                .select('id')
                .eq('slug', planSlug)
                .single()

            if (plan) {
                query = query.eq('plan_id', plan.id)
            }
        }

        const { data: subscriptions, error } = await query

        if (error) throw error

        // Calculate metrics
        const metrics = {
            total: subscriptions.length,
            active: subscriptions.filter(s => s.status === 'active').length,
            trialing: subscriptions.filter(s => s.status === 'trialing').length,
            cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
            mrr: subscriptions
                .filter(s => s.status === 'active' && s.billing_cycle === 'monthly')
                .reduce((sum, s) => sum + parseFloat(s.plan?.price_monthly || 0), 0),
            arr: subscriptions
                .filter(s => s.status === 'active')
                .reduce((sum, s) => {
                    const monthly = s.billing_cycle === 'monthly'
                        ? parseFloat(s.plan?.price_monthly || 0) * 12
                        : parseFloat(s.plan?.price_yearly || 0)
                    return sum + monthly
                }, 0)
        }

        return corsJSON({ subscriptions, metrics })
    } catch (e) {
        console.error('platform/subscriptions GET error:', e)
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

        // Check platform admin access
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'platform_admin') {
            return corsJSON({ error: 'Platform Admin access required' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const action = searchParams.get('action')
        const id = searchParams.get('id')

        if (!action || !id) {
            return corsJSON({ error: 'Missing action or subscription ID' }, { status: 400 })
        }

        let updateData = {}

        switch (action) {
            case 'cancel':
                updateData = {
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                    cancel_at_period_end: true
                }
                break

            case 'activate':
                updateData = {
                    status: 'active',
                    cancelled_at: null,
                    cancel_at_period_end: false
                }
                break

            case 'change_plan':
                const { planId, billingCycle } = await request.json()
                if (!planId) {
                    return corsJSON({ error: 'Missing plan ID' }, { status: 400 })
                }

                // Verify plan exists
                const { data: targetPlan } = await adminClient
                    .from('subscription_plans')
                    .select('*')
                    .eq('id', planId)
                    .single()

                if (!targetPlan) {
                    return corsJSON({ error: 'Invalid plan ID' }, { status: 400 })
                }

                updateData = {
                    plan_id: planId,
                    billing_cycle: billingCycle || 'monthly',
                    status: 'active',
                    trial_ends_at: null,
                    // Optional: You might want to update current_period_end if logic requires
                }
                break

            case 'extend_trial':
                const { days = 7 } = await request.json()
                const { data: sub } = await adminClient
                    .from('subscriptions')
                    .select('trial_ends_at')
                    .eq('id', id)
                    .single()

                const currentTrialEnd = sub?.trial_ends_at ? new Date(sub.trial_ends_at) : new Date()
                const newTrialEnd = new Date(currentTrialEnd.getTime() + days * 24 * 60 * 60 * 1000)

                updateData = {
                    trial_ends_at: newTrialEnd.toISOString(),
                    status: 'trialing'
                }
                break

            default:
                return corsJSON({ error: 'Invalid action' }, { status: 400 })
        }

        const { data, error } = await adminClient
            .from('subscriptions')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        // Log action
        await adminClient.from('audit_logs').insert({
            user_id: user.id,
            user_name: profile.email || 'Platform Admin',
            action: `SUBSCRIPTION_${action.toUpperCase()}`,
            entity_type: 'subscription',
            entity_id: id,
            metadata: { action, updateData }
        })

        return corsJSON({ success: true, subscription: data })
    } catch (e) {
        console.error('platform/subscriptions POST error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
