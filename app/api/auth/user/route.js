import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserPermissions } from '@/lib/permissions'
import { corsJSON } from '@/lib/cors'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return corsJSON({ user: null }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        organization_id,
        is_platform_admin,
        role_id,
        organization:organizations (
          id,
          name,
          onboarding_status
        ),
        role:roles (
          id,
          name
        )
      `)
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
    }

    const permissions = await getUserPermissions(supabase, user.id)

    return corsJSON({
      user: {
        id: user.id,
        email: user.email,
        profile,
        profileError: profileError ? profileError.message : null,
        permissions
      }
    })
  } catch (e) {
    console.error('auth/user error:', e)
    return corsJSON({ error: e.message }, { status: 500 })
  }
}
