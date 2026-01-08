import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return corsJSON({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fullName, organizationName } = body
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('organization_id, full_name')
      .eq('id', user.id)
      .single()

    if (existingProfile?.organization_id) {
      return corsJSON({
        message: 'User already onboarded',
        alreadyOnboarded: true
      })
    }

    const adminClient = createAdminClient()

    const { data: org, error: orgError } = await adminClient
      .from('organizations')
      .insert({
        name: organizationName || 'My Organization',
        onboarding_status: 'PENDING'
      })
      .select()
      .single()

    if (orgError) throw new Error('Failed to create organization')

    try {
      await adminClient
        .from('organization_profiles')
        .insert({
          organization_id: org.id,
          sector: 'real_estate',
          country: 'India'
        })
    } catch (e) {
      console.warn('Failed to create organization profile:', e.message)
    }

    const { data: role, error: roleError } = await adminClient
      .from('roles')
      .select('id')
      .eq('name', 'Client Super Admin')
      .single()

    if (roleError || !role) throw new Error('Failed to fetch role')

    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        organization_id: org.id,
        role_id: role.id,
        full_name: fullName || null,
        is_platform_admin: false
      })
      .eq('id', user.id)

    if (profileError) throw new Error('Failed to update profile')

    await adminClient.from('audit_logs').insert({
      organization_id: org.id, // FIXED: Added required organization_id
      user_id: user.id,
      user_name: fullName || user.email,
      action: 'ORG_CREATED',
      entity_type: 'organization',
      entity_id: org.id,
      metadata: { organization_name: org.name, onboarding_status: 'PENDING' },
      created_at: new Date().toISOString()
    })

    return corsJSON({
      message: 'Onboarding successful',
      organization: org,
      onboarding_status: 'PENDING'
    })
  } catch (e) {
    console.error('onboard POST error:', e)
    return corsJSON({
      error: e.message || 'Onboarding failed'
    }, { status: 500 })
  }
}
