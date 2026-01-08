import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
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

    if (isPlatformAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_platform_admin')
        .eq('id', data.user.id)
        .single()

      if (!profile?.is_platform_admin) {
        await supabase.auth.signOut()
        return corsJSON({ error: 'Not authorized as platform admin' }, { status: 403 })
      }
    }

    return corsJSON({
      message: 'Login successful',
      user: data.user,
      session: data.session
    })
  } catch (e) {
    console.error('auth/signin error:', e)
    return corsJSON({ error: e.message }, { status: 500 })
  }
}
