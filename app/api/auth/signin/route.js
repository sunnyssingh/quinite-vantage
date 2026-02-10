import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { email, password, isPlatformAdmin } = body

    console.log('[Signin] Attempting signin for:', email, isPlatformAdmin ? '(Platform Admin)' : '(Regular User)')

    if (!email || !password) {
      console.log('[Signin] Missing credentials')
      return corsJSON({ error: 'Email and password are required' }, { status: 400 })
    }

    // Attempt authentication
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      console.error('[Signin] Authentication failed:', error.message)
      return corsJSON({ error: error.message }, { status: 401 })
    }

    console.log('[Signin] Authentication successful for user:', data.user.id)

    // Get user profile and check onboarding status
    const admin = createAdminClient()
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('organization_id, role, organization:organizations(onboarding_status)')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('[Signin] Profile query error:', profileError)
      console.error('[Signin] Profile error details:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      })

      // If profile doesn't exist, return specific error
      if (profileError.code === 'PGRST116') {
        await supabase.auth.signOut()
        return corsJSON({
          error: 'Profile not found. Please contact support to set up your account.'
        }, { status: 404 })
      }

      // For other profile errors, still try to continue but log the issue
      console.warn('[Signin] Continuing despite profile error')
    }

    console.log('[Signin] Profile data:', {
      userId: data.user.id,
      role: profile?.role,
      organizationId: profile?.organization_id,
      onboardingStatus: profile?.organization?.onboarding_status
    })

    // Check if platform admin (if requested)
    if (isPlatformAdmin) {
      console.log('[Signin] Checking platform admin access for role:', profile?.role)
      if (profile?.role !== 'platform_admin') {
        console.warn('[Signin] Access denied - user is not platform_admin')
        await supabase.auth.signOut()
        return corsJSON({
          error: 'Not authorized as platform admin. Your role is: ' + (profile?.role || 'unknown')
        }, { status: 403 })
      }
      console.log('[Signin] Platform admin access granted')
    }

    // Determine if user needs onboarding
    // Only send to onboarding if:
    // 1. User has no organization assigned, OR
    // 2. Organization exists but onboarding is still pending
    const hasOrganization = !!profile?.organization_id
    const onboardingStatus = profile?.organization?.onboarding_status
    const needsOnboarding = !hasOrganization || onboardingStatus === 'pending'

    console.log('[Signin] Onboarding check:', {
      needsOnboarding,
      hasOrganization,
      organizationId: profile?.organization_id,
      onboardingStatus,
      rawOrganizationData: profile?.organization
    })

    console.log('[Signin] Login successful for:', email)

    return corsJSON({
      message: 'Login successful',
      user: {
        ...data.user,
        role: profile?.role,
        organization_id: profile?.organization_id
      },
      session: data.session,
      needsOnboarding
    })
  } catch (e) {
    console.error('[Signin] Unexpected error:', e)
    console.error('[Signin] Error stack:', e.stack)
    return corsJSON({ error: e.message }, { status: 500 })
  }
}

