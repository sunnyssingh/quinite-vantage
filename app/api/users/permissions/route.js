import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/permissions'

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function PUT(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

    const body = await request.json()
    const { userId, featureId, granted } = body
    if (!userId || !featureId) return handleCORS(NextResponse.json({ error: 'userId and featureId required' }, { status: 400 }))

    const { error } = await supabase.from('user_permissions').upsert({ user_id: userId, feature_id: featureId, granted })
    if (error) throw error

    await logAudit(supabase, user.id, null, 'user.permissions_updated', 'user', userId, { feature_id: featureId, granted })

    return handleCORS(NextResponse.json({ message: 'Permission updated successfully' }))
  } catch (e) {
    console.error('users/permissions PUT error:', e)
    return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}
