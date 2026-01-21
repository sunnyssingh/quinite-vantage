import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'
import Razorpay from 'razorpay'

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
            .select('organization_id, role, email, full_name')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'No organization found' }, { status: 404 })
        }

        // Only super_admin can initiate payments
        if (profile.role !== 'super_admin') {
            return corsJSON({ error: 'Only organization admins can manage payments' }, { status: 403 })
        }

        const { plan_slug, billing_cycle = 'monthly' } = await request.json()

        if (!plan_slug) {
            return corsJSON({ error: 'Plan slug required' }, { status: 400 })
        }

        // Get plan details
        const { data: plan, error: planError } = await adminClient
            .from('subscription_plans')
            .select('*')
            .eq('slug', plan_slug)
            .single()

        if (planError || !plan) {
            return corsJSON({ error: 'Plan not found' }, { status: 404 })
        }

        // Get organization details
        const { data: org } = await adminClient
            .from('organizations')
            .select('name, company_name')
            .eq('id', profile.organization_id)
            .single()

        // Calculate amount based on billing cycle
        const amount = billing_cycle === 'monthly' ? plan.price_monthly : plan.price_yearly

        if (amount === 0) {
            return corsJSON({ error: 'This plan does not require payment' }, { status: 400 })
        }

        // Check if Razorpay is configured
        const isRazorpayConfigured = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET

        let order_id, invoice

        if (isRazorpayConfigured) {
            // Initialize Razorpay
            console.log('💳 [Payment] Initializing Real Razorpay Order')
            const razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET
            })

            // Create Razorpay order
            const order = await razorpay.orders.create({
                amount: amount * 100, // Razorpay expects amount in paise
                currency: 'INR',
                receipt: `sub_${profile.organization_id}_${Date.now()}`,
                notes: {
                    organization_id: profile.organization_id,
                    plan_id: plan.id,
                    plan_slug: plan.slug,
                    billing_cycle: billing_cycle,
                    user_id: user.id
                }
            })

            order_id = order.id

            // Create invoice record
            const { data: invoiceData } = await adminClient
                .from('invoices')
                .insert({
                    organization_id: profile.organization_id,
                    amount: amount,
                    currency: 'INR',
                    status: 'open',
                    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    metadata: {
                        razorpay_order_id: order.id,
                        plan_slug: plan.slug,
                        billing_cycle: billing_cycle
                    }
                })
                .select()
                .single()

            invoice = invoiceData
        } else {
            // SIMULATION MODE - No Razorpay configured
            console.log('[SIMULATION MODE] Razorpay not configured, using dummy payment')

            order_id = `sim_order_${Date.now()}`

            // Create invoice record for simulation
            const { data: invoiceData } = await adminClient
                .from('invoices')
                .insert({
                    organization_id: profile.organization_id,
                    amount: amount,
                    currency: 'INR',
                    status: 'open',
                    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    metadata: {
                        simulation_order_id: order_id,
                        plan_slug: plan.slug,
                        billing_cycle: billing_cycle,
                        is_simulation: true
                    }
                })
                .select()
                .single()

            invoice = invoiceData

            // Auto-complete the payment in simulation mode
            setTimeout(async () => {
                try {
                    // Update invoice as paid
                    await adminClient
                        .from('invoices')
                        .update({
                            status: 'paid',
                            paid_at: new Date().toISOString(),
                            metadata: {
                                ...invoice.metadata,
                                simulation_payment_id: `sim_pay_${Date.now()}`,
                                payment_method: 'simulation'
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
                                cancelled_at: null
                            })
                            .eq('id', currentSub.id)
                    }

                    console.log('[SIMULATION MODE] Payment auto-completed')
                } catch (error) {
                    console.error('[SIMULATION MODE] Error auto-completing payment:', error)
                }
            }, 2000) // Simulate 2 second payment processing
        }

        // Return order details for frontend
        return corsJSON({
            order_id: order_id,
            amount: amount,
            currency: 'INR',
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'simulation_key',
            name: org?.company_name || org?.name || 'Your Organization',
            description: `${plan.name} Plan - ${billing_cycle === 'monthly' ? 'Monthly' : 'Yearly'} Subscription`,
            prefill: {
                name: profile.full_name,
                email: profile.email
            },
            theme: {
                color: '#7c3aed'
            },
            invoice_id: invoice.id,
            is_simulation: !isRazorpayConfigured
        })
    } catch (e) {
        console.error('payment/checkout POST error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
