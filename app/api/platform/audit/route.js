import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

    const { data: profile } = await supabase.from('profiles').select('is_platform_admin').eq('id', user.id).single()
    if (!profile?.is_platform_admin) return handleCORS(NextResponse.json({ error: 'Platform Admin access required' }, { status: 403 }))

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')

    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit)
    if (error) throw error
    return handleCORS(NextResponse.json({ logs: data || [] }))
  } catch (e) {
    console.error('platform/audit GET error:', e)
    return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}
