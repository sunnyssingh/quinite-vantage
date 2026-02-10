import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/billing/invoices/[id]
 * Get invoice details by ID
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
        const { data: invoice, error } = await supabase
            .from('billing_invoices')
            .select('*')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single()

        if (error || !invoice) {
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ invoice })
    } catch (error) {
        console.error('Error in GET /api/billing/invoices/[id]:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
