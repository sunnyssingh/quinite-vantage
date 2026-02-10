import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { verifyRazorpaySignature, fetchRazorpayPayment } from '@/lib/billing/razorpay'
import { markInvoicePaid } from '@/lib/billing/invoice-generator'
import { addCallCredits } from '@/lib/middleware/subscription'

/**
 * POST /api/billing/payment/razorpay/verify
 * Verify Razorpay payment and update invoice status
 */
export async function POST(request) {
    try {
        const supabase = await createServerSupabaseClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = body

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json(
                { error: 'Missing payment details' },
                { status: 400 }
            )
        }

        // Verify signature
        const isValid = verifyRazorpaySignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        )

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid payment signature' },
                { status: 400 }
            )
        }

        // Fetch payment details from Razorpay
        const { success, payment, error: paymentError } = await fetchRazorpayPayment(razorpay_payment_id)

        if (!success) {
            return NextResponse.json(
                { error: paymentError || 'Failed to verify payment' },
                { status: 500 }
            )
        }

        // Get payment transaction
        const { data: transaction, error: txError } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('gateway_order_id', razorpay_order_id)
            .single()

        if (txError || !transaction) {
            return NextResponse.json(
                { error: 'Payment transaction not found' },
                { status: 404 }
            )
        }

        // Update payment transaction
        await supabase
            .from('payment_transactions')
            .update({
                gateway_payment_id: razorpay_payment_id,
                gateway_signature: razorpay_signature,
                status: payment.status === 'captured' ? 'captured' : 'authorized',
                payment_method: payment.method,
                metadata: { payment }
            })
            .eq('id', transaction.id)

        // Mark invoice as paid
        if (transaction.invoice_id) {
            await markInvoicePaid(
                transaction.invoice_id,
                payment.method,
                razorpay_payment_id
            )
        }

        // If this was a credit purchase, add credits
        const { data: invoice } = await supabase
            .from('billing_invoices')
            .select('line_items, organization_id')
            .eq('id', transaction.invoice_id)
            .single()

        if (invoice && invoice.line_items) {
            const creditItems = invoice.line_items.filter(item => item.type === 'credit_purchase')

            for (const item of creditItems) {
                await addCallCredits(
                    invoice.organization_id,
                    item.quantity,
                    'purchase',
                    transaction.id,
                    user.id
                )
            }
        }

        return NextResponse.json({
            success: true,
            payment_id: razorpay_payment_id,
            status: payment.status
        })
    } catch (error) {
        console.error('Error in POST /api/billing/payment/razorpay/verify:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
