import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkFeatureAccess } from '@/lib/middleware/subscription'

/**
 * GET /api/billing/feature-access
 * Check if organization has access to a specific feature
 */
export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { searchParams } = new URL(request.url)
        const feature = searchParams.get('feature')

        if (!feature) {
            return NextResponse.json(
                { error: 'Feature parameter is required' },
                { status: 400 }
            )
        }

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
                { hasAccess: false, reason: 'No organization found' },
                { status: 200 }
            )
        }

        // Check feature access
        const result = await checkFeatureAccess(profile.organization_id, feature)

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error in GET /api/billing/feature-access:', error)
        return NextResponse.json(
            { hasAccess: false, reason: 'Error checking feature access' },
            { status: 500 }
        )
    }
}
