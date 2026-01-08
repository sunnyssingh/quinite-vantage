import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

    const { data: impersonatorProfile } = await supabase.from('profiles').select('is_platform_admin').eq('id', user.id).single()
    if (!impersonatorProfile?.is_platform_admin) return handleCORS(NextResponse.json({ error: 'Only Platform Admins can impersonate users' }, { status: 403 }))

    const { targetUserId, organizationId } = body
    if (!targetUserId || !organizationId) return handleCORS(NextResponse.json({ error: 'targetUserId and organizationId are required' }, { status: 400 }))

    const adminClient = createAdminClient()

    try {
      const { data: targetProfile, error: targetError } = await adminClient.from('profiles').select('*, organization:organizations(name), role:roles(name)').eq('id', targetUserId).eq('organization_id', organizationId).single()
      if (targetError || !targetProfile) throw new Error('Target user not found in specified organization')

      await adminClient.from('impersonation_sessions').update({ is_active: false, ended_at: new Date().toISOString() }).eq('impersonator_user_id', user.id).eq('is_active', true)

      const { data: session, error: sessionError } = await adminClient.from('impersonation_sessions').insert({ impersonator_user_id: user.id, impersonated_user_id: targetUserId, impersonated_org_id: organizationId, is_active: true }).select().single()
      if (sessionError) throw new Error('Failed to create impersonation session')

      await adminClient.from('audit_logs').insert({ user_id: user.id, user_name: 'Platform Admin', action: 'IMPERSONATION_STARTED', entity_type: 'user', entity_id: targetUserId, is_impersonated: false, metadata: { target_user_email: targetProfile.email, target_organization: targetProfile.organization.name, impersonation_session_id: session.id } })

      return handleCORS(NextResponse.json({ message: 'Impersonation started', session, targetUser: { id: targetProfile.id, email: targetProfile.email, name: targetProfile.full_name, role: targetProfile.role.name, organization: targetProfile.organization.name } }))
    } catch (e) {
      console.error('platform/impersonate error:', e)
      return handleCORS(NextResponse.json({ error: e.message || 'Impersonation failed' }, { status: 500 }))
    }
  } catch (e) {
    console.error('platform/impersonate error:', e)
    return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}
