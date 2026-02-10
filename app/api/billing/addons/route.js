import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/billing/addons
 * Get available add-ons for the user's plan
 */
export async function GET(request) {
    try {
        const supabase = createAdminClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's organization and subscription
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const { data: subscription } = await supabase
            .from('organization_subscriptions')
            .select(`
        *,
        plan:billing_plans(name)
      `)
            .eq('organization_id', profile.organization_id)
            .eq('status', 'active')
            .single()

        if (!subscription) {
            return NextResponse.json({ error: 'No active subscription' }, { status: 404 })
        }

        const planName = subscription.plan?.name?.toLowerCase()

        // Get available add-ons for this plan
        const { data: addons, error } = await supabase
            .from('subscription_addons')
            .select('*')
            .eq('is_active', true)
            .contains('available_for_plans', [planName])

        if (error) {
            console.error('Error fetching add-ons:', error)
            return NextResponse.json({ error: 'Failed to fetch add-ons' }, { status: 500 })
        }

        // Get organization's purchased add-ons
        const { data: purchasedAddons } = await supabase
            .from('organization_addons')
            .select('addon_id, status')
            .eq('organization_id', profile.organization_id)
            .eq('status', 'active')

        const purchasedAddonIds = new Set(purchasedAddons?.map(a => a.addon_id) || [])

        // Mark which add-ons are already purchased
        const addonsWithStatus = addons?.map(addon => ({
            ...addon,
            is_purchased: purchasedAddonIds.has(addon.id)
        }))

        return NextResponse.json({ addons: addonsWithStatus })
    } catch (error) {
        console.error('Error in GET /api/billing/addons:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * POST /api/billing/addons
 * Purchase an add-on
 */
export async function POST(request) {
    try {
        const supabase = createAdminClient()

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

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        // Only super_admin can purchase add-ons
        if (profile.role !== 'super_admin') {
            return NextResponse.json({ error: 'Only organization admins can purchase add-ons' }, { status: 403 })
        }

        const { addon_id } = await request.json()

        if (!addon_id) {
            return NextResponse.json({ error: 'addon_id is required' }, { status: 400 })
        }

        // Verify add-on exists and is available
        const { data: addon } = await supabase
            .from('subscription_addons')
            .select('*')
            .eq('id', addon_id)
            .eq('is_active', true)
            .single()

        if (!addon) {
            return NextResponse.json({ error: 'Add-on not found or not available' }, { status: 404 })
        }

        // Check if already purchased
        const { data: existing } = await supabase
            .from('organization_addons')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .eq('addon_id', addon_id)
            .eq('status', 'active')
            .single()

        if (existing) {
            return NextResponse.json({ error: 'Add-on already purchased' }, { status: 400 })
        }

        // Create organization addon
        const { data: orgAddon, error } = await supabase
            .from('organization_addons')
            .insert({
                organization_id: profile.organization_id,
                addon_id: addon_id,
                status: 'active'
            })
            .select()
            .single()

        if (error) {
            console.error('Error purchasing add-on:', error)
            return NextResponse.json({ error: 'Failed to purchase add-on' }, { status: 500 })
        }

        return NextResponse.json({
            message: 'Add-on purchased successfully',
            addon: orgAddon
        }, { status: 201 })
    } catch (error) {
        console.error('Error in POST /api/billing/addons:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * DELETE /api/billing/addons/[id]
 * Cancel an add-on
 */
export async function DELETE(request) {
    try {
        const supabase = createAdminClient()

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

        if (!profile || profile.role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const addonId = searchParams.get('id')

        if (!addonId) {
            return NextResponse.json({ error: 'addon_id is required' }, { status: 400 })
        }

        // Cancel the add-on
        const { error } = await supabase
            .from('organization_addons')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString()
            })
            .eq('organization_id', profile.organization_id)
            .eq('addon_id', addonId)
            .eq('status', 'active')

        if (error) {
            console.error('Error cancelling add-on:', error)
            return NextResponse.json({ error: 'Failed to cancel add-on' }, { status: 500 })
        }

        return NextResponse.json({ message: 'Add-on cancelled successfully' })
    } catch (error) {
        console.error('Error in DELETE /api/billing/addons:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
