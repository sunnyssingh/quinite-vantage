import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCreditBalance, addCallCredits } from '@/lib/middleware/subscription'

/**
 * GET /api/billing/credits
 * Get organization's credit balance and transaction history
 */
export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { searchParams } = new URL(request.url)
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

        // Get credit balance
        const balanceInfo = await getCreditBalance(profile.organization_id)

        // Get recent transactions
        const { data: transactions, error: txError } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (txError) {
            return NextResponse.json(
                { error: 'Failed to fetch transactions' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            balance: balanceInfo.balance,
            lowBalance: balanceInfo.lowBalance,
            transactions
        })
    } catch (error) {
        console.error('Error in GET /api/billing/credits:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/billing/credits
 * Purchase call credits (Super Admin only)
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
        const { credits, payment_reference } = body

        // Validate
        if (!credits || credits <= 0) {
            return NextResponse.json(
                { error: 'Invalid credit amount' },
                { status: 400 }
            )
        }

        // Add credits
        const result = await addCallCredits(
            profile.organization_id,
            credits,
            'purchase',
            payment_reference || 'manual',
            user.id
        )

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            newBalance: result.newBalance
        })
    } catch (error) {
        console.error('Error in POST /api/billing/credits:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
