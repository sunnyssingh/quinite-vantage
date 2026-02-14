import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/permissions'
import { hasDashboardPermission } from '@/lib/dashboardPermissions'
import { withAuth } from '@/lib/middleware/withAuth'
import { CampaignService } from '@/services/campaign.service'

function handleCORS(response) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
}

export async function GET(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

        const canView = await hasDashboardPermission(user.id, 'view_campaigns')
        if (!canView) {
            return handleCORS(NextResponse.json({
                success: false,
                message: 'You don\'t have permission to view campaigns'
            }, { status: 200 }))
        }

        const admin = createAdminClient()
        const { data: profile } = await admin.from('profiles').select('organization_id').eq('id', user.id).single()

        if (!profile) {
            return handleCORS(NextResponse.json({ error: 'Profile not found' }, { status: 404 }))
        }

        const { id } = await params

        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single()

        if (error) throw error
        if (!data) return handleCORS(NextResponse.json({ error: 'Campaign not found' }, { status: 404 }))

        return handleCORS(NextResponse.json({ campaign: data }))
    } catch (e) {
        console.error('campaigns GET by ID error:', e)
        return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
    }
}

/**
 * PUT /api/campaigns/[id]
 * Update a campaign
 */
export const PUT = withAuth(async (request, context) => {
    try {
        const { user, profile } = context
        const body = await request.json()
        const params = await context.params
        const campaignId = params.id

        // Check permission
        const canEdit = await hasDashboardPermission(user.id, 'edit_campaigns')
        if (!canEdit) {
            return handleCORS(NextResponse.json({
                success: false,
                message: 'You don\'t have permission to edit campaigns'
            }, { status: 200 }))
        }

        if (!profile?.organization_id) {
            return handleCORS(NextResponse.json({ error: 'Organization not found' }, { status: 400 }))
        }

        if (!campaignId) {
            return handleCORS(NextResponse.json({ error: 'Campaign ID required' }, { status: 400 }))
        }

        // Update campaign using service
        const campaign = await CampaignService.updateCampaign(campaignId, body, profile.organization_id)

        // Log audit
        try {
            await logAudit({
                action: 'update',
                resource: 'campaign',
                resource_id: campaignId,
                user_id: user.id,
                details: { updated_fields: Object.keys(body) }
            })
        } catch (e) {
            console.error('Audit log error:', e)
        }

        return handleCORS(NextResponse.json({ campaign }))
    } catch (e) {
        console.error('campaigns PUT error:', e)
        return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
    }
})

export async function DELETE(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

        // Check permission
        const canDelete = await hasDashboardPermission(user.id, 'delete_campaigns')
        if (!canDelete) {
            // Return success with message instead of 403 to avoid error toasts
            return handleCORS(NextResponse.json({
                success: false,
                message: 'You don\'t have permission to delete campaigns'
            }, { status: 200 }))
        }

        const admin = createAdminClient()
        const { data: profile } = await admin.from('profiles').select('organization_id, full_name').eq('id', user.id).single()

        if (!profile) {
            return handleCORS(NextResponse.json({ error: 'Profile not found' }, { status: 404 }))
        }

        const { id } = await params

        // Verify campaign belongs to user's org
        const { data: existing } = await supabase
            .from('campaigns')
            .select('id')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single()

        if (!existing) {
            return handleCORS(NextResponse.json({ error: 'Campaign not found' }, { status: 404 }))
        }

        // 1. Delete related call_logs first (Manual Cascade)
        const { error: logsError } = await admin
            .from('call_logs')
            .delete()
            .eq('campaign_id', id)

        if (logsError) {
            console.error('❌ [Campaign DELETE] Failed to cleanup call_logs:', logsError)
        } else {
            console.log('✅ [Campaign DELETE] Cleaned up related call_logs')
        }

        // 2. Delete Campaign
        const { error } = await admin
            .from('campaigns')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('❌ [Campaign DELETE] Delete error:', error)
            throw error
        }

        try {
            await logAudit(supabase, user.id, profile.full_name || user.email, 'campaign.delete', 'campaign', id, {})
        } catch (e) {
            console.error('Audit log error:', e)
        }

        return handleCORS(NextResponse.json({ success: true }))
    } catch (e) {
        console.error('campaigns DELETE error:', e)
        return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
    }
}

export async function OPTIONS(request) {
    return handleCORS(new NextResponse(null, { status: 200 }))
}
