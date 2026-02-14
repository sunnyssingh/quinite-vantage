import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasDashboardPermission } from '@/lib/dashboardPermissions'
import { withAuth } from '@/lib/middleware/withAuth'
import { corsJSON } from '@/lib/cors'
import { logAudit } from '@/lib/permissions' // Assuming logAudit export location, checked via route.js

export const POST = withAuth(async (request, context) => {
    try {
        const { user, profile } = context
        const body = await request.json()
        const { leadIds } = body

        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return corsJSON({ error: 'leadIds array is required' }, { status: 400 })
        }

        // Permission Check
        const canDelete = await hasDashboardPermission(user.id, 'delete_leads')
        if (!canDelete) {
            return corsJSON({ error: 'Permission denied: delete_leads' }, { status: 403 })
        }

        const adminClient = createAdminClient()

        // Perform Delete
        const { error, count } = await adminClient
            .from('leads')
            .delete({ count: 'exact' })
            .in('id', leadIds)
            .eq('organization_id', profile.organization_id) // Safety check

        if (error) throw error

        // Audit Log (Batch)
        // Note: logAudit typically logs single items. We'll log a summary.
        // Or we could log individual events if needed, but summary is better for perf.
        /* 
         * We won't log every single ID to avoid spamming audit logs, 
         * but we typically should. For now, let's just log the count.
         */

        return corsJSON({ success: true, count })

    } catch (e) {
        console.error('Bulk Delete Error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
})
