import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInvoicePDFBlob } from '@/lib/billing/pdf-generator'

/**
 * GET /api/billing/invoices/[id]/download
 * Download invoice as PDF
 */
export async function GET(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { id } = params

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's organization
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile || !profile.organization_id) {
            return NextResponse.json(
                { error: 'No organization found' },
                { status: 404 }
            )
        }

        // Get invoice
        const { data: invoice, error: invoiceError } = await supabase
            .from('billing_invoices')
            .select('*')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single()

        if (invoiceError || !invoice) {
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            )
        }

        // Get organization details
        const { data: organization } = await supabase
            .from('organizations')
            .select('name, email')
            .eq('id', profile.organization_id)
            .single()

        // Generate PDF
        const pdfBlob = getInvoicePDFBlob(invoice, organization || {})

        // Return PDF as response
        return new NextResponse(pdfBlob, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`
            }
        })
    } catch (error) {
        console.error('Error in GET /api/billing/invoices/[id]/download:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
