import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { email, password, companyName, fullName } = body

    if (!email || !password) {
      return handleCORS(NextResponse.json({ error: 'Email and password are required' }, { status: 400 }))
    }

    // Sign up with email confirmation enabled
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        data: {
          full_name: fullName,
          company_name: companyName
        }
      }
    })

    if (signUpError) return handleCORS(NextResponse.json({ error: signUpError.message }, { status: 400 }))

    // Check if email confirmation is required
    const needsConfirmation = !authData.user?.email_confirmed_at

    return handleCORS(NextResponse.json({
      message: 'Signup successful',
      user: authData.user,
      needsConfirmation
    }))
  } catch (e) {
    console.error('auth/signup error:', e)
    return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}

