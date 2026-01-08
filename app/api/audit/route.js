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

    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const pageSize = Math.min(parseInt(searchParams.get('page_size') || '50'), 200)
    const offset = (page - 1) * pageSize

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (!profile.is_platform_admin) {
      query = query.eq('organization_id', profile.organization_id)
    }

    query = query.range(offset, offset + pageSize - 1)

    const { data, count, error } = await query
    if (error) throw error

    return NextResponse.json({
      logs: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    })
  } catch (e) {
    console.error('audit list error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
