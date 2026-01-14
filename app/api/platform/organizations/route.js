import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { corsJSON } from '@/lib/cors'

export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return corsJSON({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'platform_admin') {
      return corsJSON({ error: 'Platform Admin access required' }, { status: 403 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (id) {
      const { data: org, error } = await supabase
        .from('organizations')
        .select(`
          *, 
          users:profiles(id, email, full_name, role, created_at)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return corsJSON({ organization: org })
    }

    const { data, error } = await supabase
      .from('organizations')
      .select(`*, _count:profiles(count)`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return corsJSON({ organizations: data || [] })
  } catch (e) {
    console.error('platform/organizations GET error:', e)
    return corsJSON({ error: e.message }, { status: 500 })
  }
}
