import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'
import crypto from 'crypto'

export async function POST(request) {
    try {
        const body = await request.text()
        const signature = request.headers.get('x-razorpay-signature')

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(body)
            .digest('hex')

        if (signature !== expectedSignature) {
            console.error('Invalid webhook signature')
            return corsJSON({ error: 'Invalid signature' }, { status: 400 })
        }

        const event = JSON.parse(body)
        const adminClient = createAdminClient()

        console.log('[Razorpay Webhook]', event.event, event.payload)

        // Handle payment.captured event
        if (event.event === 'payment.captured') {
            const payment = event.payload.payment.entity
            const orderId = payment.order_id
            const paymentId = payment.id

            // Find invoice by razorpay order ID
            const { data: invoice } = await adminClient
                .from('invoices')
                .select('*')
                .eq('metadata->>razorpay_order_id', orderId)
                .single()

            if (!invoice) {
                console.error('Invoice not found for order:', orderId)
                return corsJSON({ error: 'Invoice not found' }, { status: 404 })
            }

            // Update invoice as paid
            await adminClient
                .from('invoices')
                .update({
                    status: 'paid',
                    paid_at: new Date().toISOString(),
                    metadata: {
                        ...invoice.metadata,
                        razorpay_payment_id: paymentId,
                        payment_method: payment.method
                    }
                })
                .eq('id', invoice.id)

            // Get plan details from invoice metadata
            const planSlug = invoice.metadata.plan_slug
            const billingCycle = invoice.metadata.billing_cycle || 'monthly'

            // Get plan
            const { data: plan } = await adminClient
                .from('subscription_plans')
                .select('*')
                .eq('slug', planSlug)
                .single()

            if (!plan) {
                console.error('Plan not found:', planSlug)
                return corsJSON({ error: 'Plan not found' }, { status: 404 })
            }

            // Get current subscription
            const { data: currentSub } = await adminClient
                .from('subscriptions')
                .select('*')
                .eq('organization_id', invoice.organization_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            // Calculate period dates
            const now = new Date()
            const periodEnd = new Date(now)
            if (billingCycle === 'monthly') {
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
                        billing_cycle: billingCycle,
                        current_period_start: now.toISOString(),
                        current_period_end: periodEnd.toISOString(),
                        trial_ends_at: null,
                        cancel_at_period_end: false,
                        cancelled_at: null
                    })
                    .eq('id', currentSub.id)
            } else {
                // Create new subscription
                await adminClient
                    .from('subscriptions')
                    .insert({
                        organization_id: invoice.organization_id,
                        plan_id: plan.id,
                        status: 'active',
                        billing_cycle: billingCycle,
                        current_period_start: now.toISOString(),
                        current_period_end: periodEnd.toISOString()
                    })
            }

            // Log the upgrade
            await adminClient.from('audit_logs').insert({
                organization_id: invoice.organization_id,
                action: 'SUBSCRIPTION_PAYMENT_SUCCESS',
                entity_type: 'subscription',
                metadata: {
                    plan_slug: planSlug,
                    billing_cycle: billingCycle,
                    amount: payment.amount / 100,
                    payment_id: paymentId
                }
            })

            console.log('[Razorpay Webhook] Payment processed successfully:', paymentId)
        }

        // Handle payment.failed event
        if (event.event === 'payment.failed') {
            const payment = event.payload.payment.entity
            const orderId = payment.order_id

            // Find and update invoice
            await adminClient
                .from('invoices')
                .update({
                    status: 'uncollectible',
                    metadata: {
                        razorpay_order_id: orderId,
                        error: payment.error_description
                    }
                })
                .eq('metadata->>razorpay_order_id', orderId)

            console.log('[Razorpay Webhook] Payment failed:', payment.id)
        }

        return corsJSON({ success: true })
    } catch (e) {
        console.error('payment/webhook error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
