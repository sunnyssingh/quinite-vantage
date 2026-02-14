import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasDashboardPermission } from '@/lib/dashboardPermissions'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization and role
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    // Get user role - ONLY platform_admin can view all logs
    const isPlatformAdmin = profile?.role === 'platform_admin';

    // Regular users MUST have an organization_id
    if (!profile?.organization_id && !isPlatformAdmin) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }

    // Check permission
    const canView = await hasDashboardPermission(user.id, 'view_settings')
    if (!canView) {
      return NextResponse.json({ error: 'Forbidden - Missing \"view_settings\" permission' }, { status: 403 })
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

    // DEBUG LOGGING
    console.log(`🔍 [Audit API] User: ${user.email} | Role: ${profile?.role} | IsPlatformAdmin: ${isPlatformAdmin} | Org: ${profile?.organization_id}`);

    // Use ADMIN client to query logs (Bypass RLS)
    let query = admin
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // STRICT: Regular users can ONLY see their organization's logs
    if (!isPlatformAdmin) {
      console.log(`🔒 [Audit API] Filtering to organization: ${profile.organization_id}`);
      query = query.eq('organization_id', profile.organization_id)

      // [User Request Fix] Users should not see other users' logs unless they are Admins/Owners
      // We check the role name. Ideally this should be a permission like 'view_all_audit_logs'.
      const viewAllRoles = ['Owner', 'Admin', 'Super Admin']
      const canViewOthers = viewAllRoles.some(r => r.toLowerCase() === profile.role?.toLowerCase())

      // Also check specific permission if available (future proofing)
      const hasViewAllPermission = await hasDashboardPermission(user.id, 'view_all_audit_logs')

      if (!canViewOthers && !hasViewAllPermission) {
        console.log(`🔒 [Audit API] Restricting to user: ${user.id}`);
        query = query.eq('user_id', user.id)
      }
    } else {
      console.log(`🔓 [Audit API] Platform admin - showing all logs`);
      // Platform admins see all, UNLESS they specifically ask for an org
      if (searchParams.get('organization_id')) {
        query = query.eq('organization_id', searchParams.get('organization_id'))
      }
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
