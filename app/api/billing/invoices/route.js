import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/billing/invoices
 * Get organization's invoices
 */
export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const limit = parseInt(searchParams.get('limit') || '50')

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

        // Build query
        let query = supabase
            .from('billing_invoices')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (status) {
            query = query.eq('status', status)
        }

        const { data: invoices, error } = await query

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch invoices' },
                { status: 500 }
            )
        }

        return NextResponse.json({ invoices })
    } catch (error) {
        console.error('Error in GET /api/billing/invoices:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
