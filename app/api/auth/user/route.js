import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return corsJSON({ user: null }, { status: 401 })
    }

    // Use admin client to fetch profile with organization
    const admin = createAdminClient()
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('*, organization:organizations(*)')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
    }



    return corsJSON({
      user: {
        id: user.id,
        email: user.email,
        profile,
        profileError: profileError ? profileError.message : null,
      }
    })
  } catch (e) {
    console.error('auth/user error:', e)
    return corsJSON({ error: e.message }, { status: 500 })
  }
}
