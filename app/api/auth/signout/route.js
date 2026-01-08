import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.signOut()
    if (error) return handleCORS(NextResponse.json({ error: error.message }, { status: 400 }))
    return handleCORS(NextResponse.json({ message: 'Signed out successfully' }))
  } catch (e) {
    console.error('auth/signout error:', e)
    return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}
