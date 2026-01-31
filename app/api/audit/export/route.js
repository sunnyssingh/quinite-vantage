import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Get user's organization and role
        const admin = createAdminClient()
        const { data: profile } = await admin
            .from('profiles')
            .select('organization_id, role')
            .eq('id', user.id)
            .single()

        // ONLY platform_admin can export all logs
        const isPlatformAdmin = profile?.role === 'platform_admin';

        if (!profile?.organization_id && !isPlatformAdmin) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
        }

        console.log(`📥 [Audit Export] User: ${user.email} | Role: ${profile?.role} | IsPlatformAdmin: ${isPlatformAdmin} | Org: ${profile?.organization_id}`);

        const { searchParams } = new URL(request.url)
        const format = searchParams.get('format')
        const search = searchParams.get('search')
        const action = searchParams.get('action')
        const entityType = searchParams.get('entity_type')
        const startDate = searchParams.get('start_date')
        const endDate = searchParams.get('end_date')
        const isImpersonated = searchParams.get('is_impersonated')

        let query = admin
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10000)

        // STRICT: Regular users can ONLY export their organization's logs
        if (!isPlatformAdmin) {
            console.log(`🔒 [Audit Export] Filtering to organization: ${profile.organization_id}`);
            query = query.eq('organization_id', profile.organization_id)
        } else {
            console.log(`🔓 [Audit Export] Platform admin - exporting all logs`);
        }

        // Apply filters
        if (search) {
            query = query.or(`user_name.ilike.%${search}%,action.ilike.%${search}%,entity_type.ilike.%${search}%`)
        }
        if (action) {
            query = query.eq('action', action)
        }
        if (entityType) {
            query = query.eq('entity_type', entityType)
        }
        if (startDate) {
            query = query.gte('created_at', startDate)
        }
        if (endDate) {
            query = query.lte('created_at', endDate)
        }
        if (isImpersonated === 'true') {
            query = query.eq('is_impersonated', true)
        } else if (isImpersonated === 'false') {
            query = query.eq('is_impersonated', false)
        }

        const { data: logs, error } = await query

        if (error) throw error

        if (format === 'csv') {
            // Convert to CSV
            const headers = ['Timestamp', 'User Name', 'User ID', 'Action', 'Entity Type', 'Entity ID', 'Impersonated', 'Metadata']
            const rows = (logs || []).map(log => [
                new Date(log.created_at).toLocaleString(),
                log.user_name || '',
                log.user_id,
                log.action,
                log.entity_type,
                log.entity_id || '',
                log.is_impersonated ? 'Yes' : 'No',
                JSON.stringify(log.metadata || {}).replace(/"/g, '""') // Escape quotes for CSV
            ])

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n')

            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`
                }
            })
        }

        // Default JSON
        return NextResponse.json({ logs: logs || [] })

    } catch (e) {
        console.error('audit export error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
