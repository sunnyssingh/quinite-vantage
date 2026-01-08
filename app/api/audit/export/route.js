import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/permissions'

export async function GET(request) {
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
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10000)

        if (!profile.is_platform_admin) {
            query = query.eq('organization_id', profile.organization_id)
        }

        const { data } = await query

        return NextResponse.json(data || [])
    } catch (e) {
        console.error('audit export error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
