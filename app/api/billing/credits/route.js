import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCreditBalance } from '@/lib/middleware/subscription'

/**
 * GET /api/billing/credits
 * Returns organization's full credit state and last 50 transactions.
 */
export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '50')

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's organization from profiles table
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 })
        }

        const orgId = profile.organization_id

        // Fetch credit balance and transactions in parallel
        const [credits, { data: transactions, error: txError }] = await Promise.all([
            getCreditBalance(orgId),
            adminClient
                .from('credit_transactions')
                .select('*')
                .eq('organization_id', orgId)
                .order('created_at', { ascending: false })
                .limit(limit)
        ])

        if (txError) {
            console.error('Failed to fetch credit transactions:', txError)
            return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
        }

        return NextResponse.json({ credits, transactions: transactions || [] })
    } catch (error) {
        console.error('Error in GET /api/billing/credits:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
