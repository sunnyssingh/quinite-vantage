import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/billing/payment-methods
 * Get all saved payment methods for organization
 */
export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's organization
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, role')
            .eq('id', user.id)
            .single()

        if (!profile || !profile.organization_id) {
            return NextResponse.json(
                { error: 'No organization found' },
                { status: 404 }
            )
        }

        // Only super_admin can view payment methods
        if (profile.role !== 'super_admin') {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            )
        }

        // Get payment methods
        const { data: methods, error } = await supabase
            .from('saved_payment_methods')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching payment methods:', error)
            return NextResponse.json(
                { error: 'Failed to fetch payment methods' },
                { status: 500 }
            )
        }

        return NextResponse.json({ methods: methods || [] })
    } catch (error) {
        console.error('Error in GET /api/billing/payment-methods:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
