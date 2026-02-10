import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { verifyRazorpaySignature } from '@/lib/billing/razorpay'
import { markInvoicePaid } from '@/lib/billing/invoice-generator'

/**
 * POST /api/billing/payment/razorpay/webhook
 * Handle Razorpay webhooks for payment events
 */
export async function POST(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const body = await request.json()
        const signature = request.headers.get('x-razorpay-signature')

        // Verify webhook signature
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
        if (!webhookSecret) {
            console.error('Razorpay webhook secret not configured')
            return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
        }

        // Razorpay webhook signature verification
        const crypto = require('crypto')
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(body))
            .digest('hex')

        if (expectedSignature !== signature) {
            console.error('Invalid webhook signature')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        const event = body.event
        const payload = body.payload.payment.entity

        console.log('Razorpay webhook event:', event)

        switch (event) {
            case 'payment.captured':
                // Payment was successfully captured
                await handlePaymentCaptured(supabase, payload)
                break

            case 'payment.failed':
                // Payment failed
                await handlePaymentFailed(supabase, payload)
                break

            case 'refund.created':
                // Refund was initiated
                await handleRefundCreated(supabase, payload)
                break

            default:
                console.log('Unhandled webhook event:', event)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in Razorpay webhook:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

async function handlePaymentCaptured(supabase, payment) {
    try {
        // Find payment transaction
        const { data: transaction } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('gateway_payment_id', payment.id)
            .single()

        if (!transaction) {
            console.error('Payment transaction not found:', payment.id)
            return
        }

        // Update transaction status
        await supabase
            .from('payment_transactions')
            .update({
                status: 'captured',
                metadata: { payment }
            })
            .eq('id', transaction.id)

        // Mark invoice as paid
        if (transaction.invoice_id) {
            await markInvoicePaid(
                transaction.invoice_id,
                payment.method,
                payment.id
            )
        }

        console.log('Payment captured successfully:', payment.id)
    } catch (error) {
        console.error('Error handling payment captured:', error)
    }
}

async function handlePaymentFailed(supabase, payment) {
    try {
        // Find payment transaction
        const { data: transaction } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('gateway_payment_id', payment.id)
            .single()

        if (!transaction) {
            console.error('Payment transaction not found:', payment.id)
            return
        }

        // Update transaction status
        await supabase
            .from('payment_transactions')
            .update({
                status: 'failed',
                failure_reason: payment.error_description,
                metadata: { payment }
            })
            .eq('id', transaction.id)

        console.log('Payment failed:', payment.id, payment.error_description)
    } catch (error) {
        console.error('Error handling payment failed:', error)
    }
}

async function handleRefundCreated(supabase, refund) {
    try {
        // Find original payment transaction
        const { data: transaction } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('gateway_payment_id', refund.payment_id)
            .single()

        if (!transaction) {
            console.error('Payment transaction not found for refund:', refund.payment_id)
            return
        }

        // Update transaction status
        await supabase
            .from('payment_transactions')
            .update({
                status: 'refunded',
                metadata: { refund }
            })
            .eq('id', transaction.id)

        // Update invoice status
        if (transaction.invoice_id) {
            await supabase
                .from('billing_invoices')
                .update({ status: 'refunded' })
                .eq('id', transaction.invoice_id)
        }

        console.log('Refund processed:', refund.id)
    } catch (error) {
        console.error('Error handling refund created:', error)
    }
}
