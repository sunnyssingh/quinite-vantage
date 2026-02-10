import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/billing/plans
 * Get all billing plans (optionally filtered by module type)
 */
export async function GET(request) {
    try {
        const supabase = createAdminClient()
        const { searchParams } = new URL(request.url)
        const moduleType = searchParams.get('module_type')
        const all = searchParams.get('all') === 'true'

        let query = supabase
            .from('billing_plans')
            .select('*')
            .order('per_user_price_inr', { ascending: true })

        // Only filter by active status if not requesting all plans
        if (!all) {
            query = query.eq('is_active', true)
        }

        if (moduleType) {
            query = query.eq('module_type', moduleType)
        }

        const { data: plans, error } = await query

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch billing plans' },
                { status: 500 }
            )
        }

        return NextResponse.json({ plans })
    } catch (error) {
        console.error('Error in GET /api/billing/plans:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/billing/plans
 * Create a new billing plan (Platform Admin only)
 */
export async function POST(request) {
    try {
        const supabase = createAdminClient()

        // Check if user is platform admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || profile.role !== 'platform_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const {
            name,
            description,
            module_type,
            base_price_inr,
            per_user_price_inr,
            discount_percentage,
            features,
            max_users
        } = body

        // Validate required fields
        if (!name || !module_type || per_user_price_inr === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const { data: plan, error } = await supabase
            .from('billing_plans')
            .insert({
                name,
                description,
                module_type,
                base_price_inr: base_price_inr || 0,
                per_user_price_inr,
                discount_percentage: discount_percentage || 0,
                features: features || {},
                max_users,
                is_active: true
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json(
                { error: 'Failed to create billing plan' },
                { status: 500 }
            )
        }

        return NextResponse.json({ plan }, { status: 201 })
    } catch (error) {
        console.error('Error in POST /api/billing/plans:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
