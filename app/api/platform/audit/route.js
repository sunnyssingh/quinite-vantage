import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { corsJSON } from '@/lib/cors'

export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return corsJSON({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check platform admin access using adminClient (bypasses RLS) and correct column 'role'
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'platform_admin') {
      return corsJSON({ error: 'Platform Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')

    // Fetch logs using adminClient to see all organizations
    const { data, error } = await adminClient
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return corsJSON({ logs: data || [] })
  } catch (e) {
    console.error('platform/audit GET error:', e)
    return corsJSON({ error: e.message }, { status: 500 })
  }
}
