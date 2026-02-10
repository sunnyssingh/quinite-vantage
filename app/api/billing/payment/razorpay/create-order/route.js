import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createRazorpayOrder } from '@/lib/billing/razorpay'

/**
 * POST /api/billing/payment/razorpay/create-order
 * Create a Razorpay order for invoice payment
 */
export async function POST(request) {
    try {
        const supabase = await createServerSupabaseClient()

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
        const { invoice_id } = body

        if (!invoice_id) {
            return NextResponse.json(
                { error: 'Invoice ID is required' },
                { status: 400 }
            )
        }

        // Get invoice
        const { data: invoice, error: invoiceError } = await supabase
            .from('billing_invoices')
            .select('*')
            .eq('id', invoice_id)
            .eq('organization_id', profile.organization_id)
            .single()

        if (invoiceError || !invoice) {
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            )
        }

        // Check if invoice is already paid
        if (invoice.status === 'paid') {
            return NextResponse.json(
                { error: 'Invoice is already paid' },
                { status: 400 }
            )
        }

        // Get organization
        const { data: organization } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', profile.organization_id)
            .single()

        // Create Razorpay order
        const { success, order, error } = await createRazorpayOrder(invoice, organization)

        if (!success) {
            return NextResponse.json(
                { error: error || 'Failed to create payment order' },
                { status: 500 }
            )
        }

        // Save payment transaction
        await supabase
            .from('payment_transactions')
            .insert({
                organization_id: profile.organization_id,
                invoice_id: invoice.id,
                payment_gateway: 'razorpay',
                gateway_order_id: order.id,
                amount: invoice.total_amount,
                currency: 'INR', // Razorpay only supports INR
                status: 'pending',
                metadata: { order }
            })

        return NextResponse.json({
            success: true,
            order,
            key_id: process.env.RAZORPAY_KEY_ID
        })
    } catch (error) {
        console.error('Error in POST /api/billing/payment/razorpay/create-order:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
