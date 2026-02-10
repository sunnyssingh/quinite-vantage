import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkSubscriptionStatus } from '@/lib/middleware/subscription'

/**
 * GET /api/billing/subscription
 * Get organization's current subscription
 */
export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's organization
        const { data: profile } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile || !profile.organization_id) {
            return NextResponse.json(
                { error: 'No organization found' },
                { status: 404 }
            )
        }

        // Get subscription with plan details
        const { data: subscription, error } = await supabase
            .from('organization_subscriptions')
            .select(`
        *,
        plan:billing_plans(*)
      `)
            .eq('organization_id', profile.organization_id)
            .single()

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch subscription' },
                { status: 500 }
            )
        }

        // Check subscription status
        const status = await checkSubscriptionStatus(profile.organization_id)

        return NextResponse.json({
            subscription,
            status
        })
    } catch (error) {
        console.error('Error in GET /api/billing/subscription:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/billing/subscription
 * Create or update organization subscription (Super Admin only)
 */
export async function POST(request) {
    try {
        const supabase = createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user is super admin
        const { data: profile } = await supabase
            .from('users')
            .select('organization_id, role')
            .eq('id', user.id)
            .single()

        if (!profile || profile.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const {
            plan_id,
            billing_cycle,
            user_count,
            modules_enabled
        } = body

        // Validate required fields
        if (!plan_id || !user_count) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Calculate next billing date
        const nextBillingDate = new Date()
        if (billing_cycle === 'annual') {
            nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
        } else {
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
        }

        // Upsert subscription
        const { data: subscription, error } = await supabase
            .from('organization_subscriptions')
            .upsert({
                organization_id: profile.organization_id,
                plan_id,
                status: 'active',
                billing_cycle: billing_cycle || 'monthly',
                user_count,
                modules_enabled: modules_enabled || ['crm'],
                started_at: new Date().toISOString(),
                next_billing_date: nextBillingDate.toISOString(),
                auto_renew: true
            }, {
                onConflict: 'organization_id'
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json(
                { error: 'Failed to create/update subscription' },
                { status: 500 }
            )
        }

        // Initialize call credits if not exists
        await supabase
            .from('call_credits')
            .upsert({
                organization_id: profile.organization_id,
                balance: 0,
                total_purchased: 0,
                total_consumed: 0
            }, {
                onConflict: 'organization_id'
            })

        return NextResponse.json({ subscription }, { status: 201 })
    } catch (error) {
        console.error('Error in POST /api/billing/subscription:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/billing/subscription
 * Update subscription details (Super Admin only)
 */
export async function PATCH(request) {
    try {
        const supabase = createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user is super admin
        const { data: profile } = await supabase
            .from('users')
            .select('organization_id, role')
            .eq('id', user.id)
            .single()

        if (!profile || profile.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const {
            user_count,
            modules_enabled,
            auto_renew
        } = body

        const updateData = {}
        if (user_count !== undefined) updateData.user_count = user_count
        if (modules_enabled !== undefined) updateData.modules_enabled = modules_enabled
        if (auto_renew !== undefined) updateData.auto_renew = auto_renew

        const { data: subscription, error } = await supabase
            .from('organization_subscriptions')
            .update(updateData)
            .eq('organization_id', profile.organization_id)
            .select()
            .single()

        if (error) {
            return NextResponse.json(
                { error: 'Failed to update subscription' },
                { status: 500 }
            )
        }

        return NextResponse.json({ subscription })
    } catch (error) {
        console.error('Error in PATCH /api/billing/subscription:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
