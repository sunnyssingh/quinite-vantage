import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's organization
        // Get user's organization and role
        const admin = createAdminClient()
        const { data: profile } = await admin
            .from('profiles')
            .select('organization_id, role')
            .eq('id', user.id)
            .single()

        // ONLY platform_admin can view all logs
        const isPlatformAdmin = profile?.role === 'platform_admin';

        if (!profile?.organization_id && !isPlatformAdmin) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
        }

        console.log(`📊 [Audit Stats] User: ${user.email} | Role: ${profile?.role} | IsPlatformAdmin: ${isPlatformAdmin} | Org: ${profile?.organization_id}`);

        let query = admin
            .from('audit_logs')
            .select('action, entity_type, created_at, is_impersonated')
            .order('created_at', { ascending: false })
            .limit(5000)

        // STRICT: Regular users can ONLY see their organization's stats
        if (!isPlatformAdmin) {
            console.log(`🔒 [Audit Stats] Filtering to organization: ${profile.organization_id}`);
            query = query.eq('organization_id', profile.organization_id)
        } else {
            console.log(`🔓 [Audit Stats] Platform admin - showing all stats`);
        }

        const { data } = await query
        const logs = data || []

        const byAction = {}
        const byEntityType = {}
        let impersonatedCount = 0

        logs.forEach(l => {
            byAction[l.action] = (byAction[l.action] || 0) + 1
            byEntityType[l.entity_type] = (byEntityType[l.entity_type] || 0) + 1
            if (l.is_impersonated) impersonatedCount++
        })

        return NextResponse.json({
            total: logs.length,
            byAction,
            byEntityType,
            impersonatedCount
        })
    } catch (e) {
        console.error('audit stats error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
