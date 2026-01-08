import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { corsJSON } from '@/lib/cors'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return corsJSON({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile to find their organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, is_platform_admin')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return corsJSON({ error: 'Profile not found' }, { status: 404 })
    }

    // Platform admins can see all organizations
    if (profile.is_platform_admin) {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return corsJSON({ organizations: data || [] })
    }

    // Regular users can only see their own organization
    if (!profile.organization_id) {
      return corsJSON({ error: 'No organization assigned' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profile.organization_id)
      .single()

    if (error) throw error
    return corsJSON({ organizations: data ? [data] : [] })
  } catch (e) {
    console.error('organizations GET error:', e)
    return corsJSON({ error: e.message }, { status: 500 })
  }
}
