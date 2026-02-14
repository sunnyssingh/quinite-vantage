import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasDashboardPermission } from '@/lib/dashboardPermissions'
import { withAuth } from '@/lib/middleware/withAuth'
import { corsJSON } from '@/lib/cors'

export const POST = withAuth(async (request, context) => {
    try {
        const { user, profile } = context
        const body = await request.json()
        const { leadIds, updates } = body

        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return corsJSON({ error: 'leadIds array is required' }, { status: 400 })
        }
        if (!updates || Object.keys(updates).length === 0) {
            return corsJSON({ error: 'updates object is required' }, { status: 400 })
        }

        // Permission Check
        // We require broadly 'edit_leads' permissions. 
        // Granular ownership checks (edit_own_leads) are hard in bulk without pre-fetching.
        // We will restrict bulk updates to those who can edit TEAM or ALL leads.
        const canEditAll = await hasDashboardPermission(user.id, 'edit_all_leads')
        const canEditTeam = await hasDashboardPermission(user.id, 'edit_team_leads')
        const canEditOwn = await hasDashboardPermission(user.id, 'edit_own_leads')

        if (!canEditAll && !canEditTeam && !canEditOwn) {
            return corsJSON({ error: 'Permission denied: edit_leads' }, { status: 403 })
        }

        // If user ONLY has edit_own, we must strictly filter by assigned_to = user.id
        // But for bulk actions, this is expensive to check DB side for every ID.
        // For now, if they don't have team/all, we reject bulk operations to be safe, 
        // OR we just execute it and rely on the fact that if they selected it in UI, they likely see it.
        // However, safely, we should probably restrict bulk update to team/all.
        // Let's allow it but add a server-side filter if they only have 'edit_own'.

        const adminClient = createAdminClient()
        let query = adminClient.from('leads').update(updates).in('id', leadIds).eq('organization_id', profile.organization_id)

        if (!canEditAll && !canEditTeam && canEditOwn) {
            // Restrict to own leads
            query = query.eq('assigned_to', user.id)
        }

        const { error, count } = await query

        if (error) throw error

        return corsJSON({ success: true, count })

    } catch (e) {
        console.error('Bulk Update Error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
})
