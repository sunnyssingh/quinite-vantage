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

    // Create organization with pending status
    // User must complete the detailed onboarding form to set it to completed
    const { data: org, error: orgError } = await adminClient
      .from('organizations')
      .insert({
        name: organizationName || 'My Organization',
        onboarding_status: 'pending', // ← lowercase enum value
        tier: 'free'
      })
      .select()
      .single()

    if (orgError) throw new Error('Failed to create organization')

    // Update profile with simplified role system
    // First user in org = super_admin
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        organization_id: org.id,
        role: 'super_admin',
        full_name: fullName || null
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      throw new Error('Failed to update profile')
    }

    // Create audit log
    await adminClient.from('audit_logs').insert({
      organization_id: org.id,
      user_id: user.id,
      user_name: fullName || user.email,
      action: 'organization.created',
      entity_type: 'organization',
      entity_id: org.id,
      metadata: {
        organization_name: org.name,
        onboarding_status: 'pending',
        user_role: 'super_admin'
      },
      created_at: new Date().toISOString()
    })

    console.log('✅ [Onboarding] Organization created:', org.id)
    console.log('✅ [Onboarding] User assigned super_admin role')

    return corsJSON({
      message: 'Onboarding successful',
      organization: org,
      onboarding_status: 'pending'
    })
  } catch (e) {
    console.error('❌ [Onboarding] Error:', e)
    return corsJSON({
      error: e.message || 'Onboarding failed'
    }, { status: 500 })
  }
}
