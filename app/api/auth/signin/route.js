import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { email, password, isPlatformAdmin } = body

    if (!email || !password) {
      return corsJSON({ error: 'Email and password are required' }, { status: 400 })
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return corsJSON({ error: error.message }, { status: 401 })
    }

    // Get user profile and check onboarding status
    const admin = createAdminClient()
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('organization_id, role, organization:organizations(onboarding_status)')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('[Signin] Profile error:', profileError)
    }

    // Check if platform admin (if requested)
    if (isPlatformAdmin) {
      if (profile?.role !== 'platform_admin') {
        await supabase.auth.signOut()
        return corsJSON({ error: 'Not authorized as platform admin' }, { status: 403 })
      }
    }

    // Determine if user needs onboarding
    const needsOnboarding = !profile?.organization_id ||
      profile?.organization?.onboarding_status === 'pending'



    return corsJSON({
      message: 'Login successful',
      user: {
        ...data.user,
        role: profile?.role
      },
      session: data.session,
      needsOnboarding
    })
  } catch (e) {

    return corsJSON({ error: e.message }, { status: 500 })
  }
}
