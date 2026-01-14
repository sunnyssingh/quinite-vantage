import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Get user's organization
        const admin = createAdminClient()
        const { data: profile } = await admin
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
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
