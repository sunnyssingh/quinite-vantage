import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * PUT /api/billing/plans/[id]
 * Update a billing plan (Platform Admin only)
 */
export async function PUT(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { id } = params

        // Check if user is platform admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('users')
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
            per_user_price_inr,
            discount_percentage,
            features,
            max_users,
            is_active
        } = body

        const updateData = {}
        if (name !== undefined) updateData.name = name
        if (description !== undefined) updateData.description = description
        if (per_user_price_inr !== undefined) updateData.per_user_price_inr = per_user_price_inr
        if (discount_percentage !== undefined) updateData.discount_percentage = discount_percentage
        if (features !== undefined) updateData.features = features
        if (max_users !== undefined) updateData.max_users = max_users
        if (is_active !== undefined) updateData.is_active = is_active

        const { data: plan, error } = await supabase
            .from('billing_plans')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            return NextResponse.json(
                { error: 'Failed to update billing plan' },
                { status: 500 }
            )
        }

        return NextResponse.json({ plan })
    } catch (error) {
        console.error('Error in PUT /api/billing/plans/[id]:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/billing/plans/[id]
 * Deactivate a billing plan (Platform Admin only)
 */
export async function DELETE(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { id } = params

        // Check if user is platform admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || profile.role !== 'platform_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Soft delete by setting is_active to false
        const { error } = await supabase
            .from('billing_plans')
            .update({ is_active: false })
            .eq('id', id)

        if (error) {
            return NextResponse.json(
                { error: 'Failed to deactivate billing plan' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in DELETE /api/billing/plans/[id]:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
