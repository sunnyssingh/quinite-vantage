import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/permissions'
import { corsJSON } from '@/lib/cors'

import { createAdminClient } from '@/lib/supabase/admin'
import { hasDashboardPermission } from '@/lib/dashboardPermissions'

export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return corsJSON({ error: 'Unauthorized' }, { status: 401 })
    }

    const canView = await hasDashboardPermission(user.id, 'view_campaigns')
    if (!canView) {
      return corsJSON({
        success: false,
        message: 'You don\'t have permission to view campaigns',
        data: []
      }, { status: 200 })
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return corsJSON({ error: 'Organization not found' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')

    let query = supabase
      .from('campaigns')
      .select('*')
      .eq('organization_id', profile.organization_id)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) throw error

    return corsJSON({ campaigns: data || [] })
  } catch (e) {
    console.error('campaigns GET error:', e)
    return corsJSON({ error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return corsJSON({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const canCreate = await hasDashboardPermission(user.id, 'create_campaigns')
    if (!canCreate) {
      return corsJSON({
        success: false,
        message: 'You don\'t have permission to create campaigns'
      }, { status: 200 })
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('organization_id, full_name')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return corsJSON({ error: 'Organization not found' }, { status: 400 })
    }

    const { project_id, name, description, start_date, end_date, time_start, time_end, metadata } = body

    if (!project_id || !start_date || !end_date || !time_start || !time_end) {
      return corsJSON({
        error: 'project_id, start_date, end_date, time_start and time_end are required'
      }, { status: 400 })
    }

    const payload = {
      organization_id: profile.organization_id,
      project_id,
      name: name || 'Call Campaign',
      description: description || null,
      start_date,
      end_date,
      time_start,
      time_end,
      status: 'scheduled',
      metadata: metadata || null,
      created_by: user.id
    }

    const { data: campaign, error } = await admin
      .from('campaigns')
      .insert(payload)
      .select()
      .single()

    if (error) throw error

    try {
      await logAudit(
        supabase,
        user.id,
        profile.full_name || user.email,
        'campaign.create',
        'campaign',
        campaign.id,
        { project_id }
      )
    } catch (e) {
      console.warn('Audit log failed:', e.message)
    }

    return corsJSON({ campaign })
  } catch (e) {
    console.error('campaigns POST error:', e)
    return corsJSON({ error: e.message }, { status: 500 })
  }
}
