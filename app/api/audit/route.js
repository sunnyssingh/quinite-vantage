import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const pageSize = Math.min(parseInt(searchParams.get('page_size') || '50'), 200)
    const offset = (page - 1) * pageSize

    const search = searchParams.get('search')
    const action = searchParams.get('action')
    const entityType = searchParams.get('entity_type')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const isImpersonated = searchParams.get('is_impersonated')

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Strict Organization Filter: All users can only see their own organization's logs
    // unless explicit platform admin logic is implemented in profile which we assume implies org_id anyway
    query = query.eq('organization_id', profile.organization_id)

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
    // Handle boolean string conversion carefully
    if (isImpersonated === 'true') {
      query = query.eq('is_impersonated', true)
    } else if (isImpersonated === 'false') {
      query = query.eq('is_impersonated', false)
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
