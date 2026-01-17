import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

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

        // Only super_admin can confirm mandate
        if (profile.role !== 'super_admin') {
            return corsJSON({ error: 'Only organization admins can manage payments' }, { status: 403 })
        }

        const { invoice_id, plan_slug, billing_cycle } = await request.json()

        if (!invoice_id || !plan_slug) {
            return corsJSON({ error: 'Missing required fields' }, { status: 400 })
        }

        // Get invoice
        const { data: invoice } = await adminClient
            .from('invoices')
            .select('*')
            .eq('id', invoice_id)
            .eq('organization_id', profile.organization_id)
            .single()

        if (!invoice) {
            return corsJSON({ error: 'Invoice not found' }, { status: 404 })
        }

        // Get plan
        const { data: plan } = await adminClient
            .from('subscription_plans')
            .select('*')
            .eq('slug', plan_slug)
            .single()

        if (!plan) {
            return corsJSON({ error: 'Plan not found' }, { status: 404 })
        }

        // Update invoice as paid (mandate confirmed)
        await adminClient
            .from('invoices')
            .update({
                status: 'paid',
                paid_at: new Date().toISOString(),
                metadata: {
                    ...invoice.metadata,
                    mandate_confirmed: true,
                    mandate_confirmed_at: new Date().toISOString(),
                    payment_method: 'mandate'
                }
            })
            .eq('id', invoice.id)

        // Get current subscription
        const { data: currentSub } = await adminClient
            .from('subscriptions')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        // Calculate period dates
        const now = new Date()
        const periodEnd = new Date(now)
        if (billing_cycle === 'monthly') {
            periodEnd.setMonth(periodEnd.getMonth() + 1)
        } else {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1)
        }

        if (currentSub) {
            // Update existing subscription
            await adminClient
                .from('subscriptions')
                .update({
                    plan_id: plan.id,
                    status: 'active',
                    billing_cycle: billing_cycle,
                    current_period_start: now.toISOString(),
                    current_period_end: periodEnd.toISOString(),
                    trial_ends_at: null,
                    cancel_at_period_end: false,
                    cancelled_at: null,
                    metadata: {
                        ...currentSub.metadata,
                        mandate_active: true,
                        mandate_confirmed_at: new Date().toISOString()
                    }
                })
                .eq('id', currentSub.id)
        }

        // Log action
        await adminClient.from('audit_logs').insert({
            organization_id: profile.organization_id,
            user_id: user.id,
            user_name: profile.email || user.email,
            action: 'PAYMENT_MANDATE_CONFIRMED',
            entity_type: 'subscription',
            metadata: {
                plan_slug: plan_slug,
                billing_cycle: billing_cycle,
                invoice_id: invoice_id
            }
        })

        console.log('[Mandate] Payment mandate confirmed for org:', profile.organization_id)

        return corsJSON({ success: true, message: 'Mandate confirmed and subscription activated' })
    } catch (e) {
        console.error('payment/mandate POST error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
