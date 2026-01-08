import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/permissions'

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, is_platform_admin')
            .eq('id', user.id)
            .single()

        if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        if (!profile.is_platform_admin) {
            const canView = await hasPermission(supabase, user.id, 'audit.view')
            if (!canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        let query = supabase
            .from('audit_logs')
            .select('action, entity_type, created_at, is_impersonated')
            .order('created_at', { ascending: false })
            .limit(5000)

        if (!profile.is_platform_admin) {
            query = query.eq('organization_id', profile.organization_id)
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
